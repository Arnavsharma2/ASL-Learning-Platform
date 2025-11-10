#!/usr/bin/env python3
"""
Deploy API Gateway + Lambda proxy for SageMaker endpoint
This allows browser clients to call SageMaker without AWS credentials
"""

import boto3
import json
import zipfile
import os
from datetime import datetime

# Configuration
LAMBDA_FUNCTION_NAME = 'asl-sagemaker-proxy'
API_GATEWAY_NAME = 'asl-inference-api'
SAGEMAKER_ENDPOINT = 'asl-inference-serverless'
REGION = 'us-east-1'


def create_lambda_zip():
    """Create deployment package for Lambda"""
    print("[1/5] Creating Lambda deployment package...")

    zip_path = 'lambda_function.zip'
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        zipf.write('lambda_proxy.py', 'lambda_function.py')

    print(f"✓ Created {zip_path}")
    return zip_path


def create_lambda_role(iam_client, account_id):
    """Create IAM role for Lambda with SageMaker permissions"""
    print("[2/5] Creating Lambda IAM role...")

    role_name = 'ASLLambdaSageMakerRole'

    # Trust policy for Lambda
    trust_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {"Service": "lambda.amazonaws.com"},
                "Action": "sts:AssumeRole"
            }
        ]
    }

    try:
        # Check if role exists
        role = iam_client.get_role(RoleName=role_name)
        role_arn = role['Role']['Arn']
        print(f"✓ Using existing role: {role_arn}")
    except iam_client.exceptions.NoSuchEntityException:
        # Create role
        role = iam_client.create_role(
            RoleName=role_name,
            AssumeRolePolicyDocument=json.dumps(trust_policy),
            Description='Lambda execution role for ASL SageMaker proxy'
        )
        role_arn = role['Role']['Arn']

        # Attach policies
        iam_client.attach_role_policy(
            RoleName=role_name,
            PolicyArn='arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
        )

        # Create inline policy for SageMaker
        sagemaker_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": "sagemaker:InvokeEndpoint",
                    "Resource": f"arn:aws:sagemaker:{REGION}:{account_id}:endpoint/{SAGEMAKER_ENDPOINT}"
                }
            ]
        }

        iam_client.put_role_policy(
            RoleName=role_name,
            PolicyName='SageMakerInvokePolicy',
            PolicyDocument=json.dumps(sagemaker_policy)
        )

        print(f"✓ Created role: {role_arn}")
        print("  Waiting 10 seconds for IAM propagation...")
        import time
        time.sleep(10)

    return role_arn


def wait_for_lambda_ready(lambda_client, function_name, max_wait=60):
    """Wait for Lambda function to be ready (not updating)"""
    import time
    start_time = time.time()
    while time.time() - start_time < max_wait:
        try:
            response = lambda_client.get_function(FunctionName=function_name)
            state = response['Configuration']['State']
            if state == 'Active':
                last_update_status = response['Configuration'].get('LastUpdateStatus', 'Successful')
                if last_update_status in ['Successful', 'InProgress']:
                    if last_update_status == 'Successful':
                        return True
                    # Still updating, wait a bit
                    time.sleep(2)
                    continue
            time.sleep(1)
        except Exception:
            time.sleep(1)
    return False


def create_lambda_function(lambda_client, role_arn, zip_path):
    """Create or update Lambda function"""
    print("[3/5] Creating Lambda function...")

    with open(zip_path, 'rb') as f:
        zip_content = f.read()

    try:
        # Wait for any in-progress updates to complete
        print("  Checking Lambda function status...")
        if wait_for_lambda_ready(lambda_client, LAMBDA_FUNCTION_NAME):
            print("  Lambda function is ready")
        else:
            print("  Warning: Lambda function may still be updating, proceeding anyway...")

        # Update existing function
        response = lambda_client.update_function_code(
            FunctionName=LAMBDA_FUNCTION_NAME,
            ZipFile=zip_content
        )

        # Wait for code update to complete before updating configuration
        print("  Waiting for code update to complete...")
        wait_for_lambda_ready(lambda_client, LAMBDA_FUNCTION_NAME, max_wait=30)

        # Update configuration
        lambda_client.update_function_configuration(
            FunctionName=LAMBDA_FUNCTION_NAME,
            Environment={
                'Variables': {
                    'SAGEMAKER_ENDPOINT': SAGEMAKER_ENDPOINT
                }
            }
        )

        print(f"✓ Updated Lambda function: {response['FunctionArn']}")
        return response['FunctionArn']

    except lambda_client.exceptions.ResourceConflictException as e:
        print(f"  Lambda function is still updating. Please wait a moment and try again.")
        raise
    except lambda_client.exceptions.ResourceNotFoundException:
        # Create new function
        response = lambda_client.create_function(
            FunctionName=LAMBDA_FUNCTION_NAME,
            Runtime='python3.11',
            Role=role_arn,
            Handler='lambda_function.lambda_handler',
            Code={'ZipFile': zip_content},
            Environment={
                'Variables': {
                    'SAGEMAKER_ENDPOINT': SAGEMAKER_ENDPOINT
                }
            },
            Timeout=30,
            MemorySize=256,
            Description='Proxy for ASL SageMaker serverless endpoint'
        )

        print(f"✓ Created Lambda function: {response['FunctionArn']}")
        return response['FunctionArn']


def create_api_gateway(apigateway_client, lambda_client, lambda_arn, account_id):
    """Create API Gateway REST API"""
    print("[4/5] Creating API Gateway...")

    # Create or get API
    apis = apigateway_client.get_rest_apis()
    existing_api = None
    for api in apis['items']:
        if api['name'] == API_GATEWAY_NAME:
            existing_api = api
            break

    if existing_api:
        api_id = existing_api['id']
        print(f"✓ Using existing API: {api_id}")
    else:
        # Create new API
        api = apigateway_client.create_rest_api(
            name=API_GATEWAY_NAME,
            description='ASL Inference API - Proxy to SageMaker',
            endpointConfiguration={'types': ['REGIONAL']}
        )
        api_id = api['id']

        # Get root resource
        resources = apigateway_client.get_resources(restApiId=api_id)
        root_id = resources['items'][0]['id']

        # Create /predict resource
        resource = apigateway_client.create_resource(
            restApiId=api_id,
            parentId=root_id,
            pathPart='predict'
        )
        resource_id = resource['id']

        # Create OPTIONS method for CORS
        apigateway_client.put_method(
            restApiId=api_id,
            resourceId=resource_id,
            httpMethod='OPTIONS',
            authorizationType='NONE'
        )

        apigateway_client.put_method_response(
            restApiId=api_id,
            resourceId=resource_id,
            httpMethod='OPTIONS',
            statusCode='200',
            responseParameters={
                'method.response.header.Access-Control-Allow-Origin': True,
                'method.response.header.Access-Control-Allow-Methods': True,
                'method.response.header.Access-Control-Allow-Headers': True,
            }
        )

        apigateway_client.put_integration(
            restApiId=api_id,
            resourceId=resource_id,
            httpMethod='OPTIONS',
            type='MOCK',
            requestTemplates={'application/json': '{"statusCode": 200}'}
        )

        apigateway_client.put_integration_response(
            restApiId=api_id,
            resourceId=resource_id,
            httpMethod='OPTIONS',
            statusCode='200',
            responseParameters={
                'method.response.header.Access-Control-Allow-Origin': "'*'",
                'method.response.header.Access-Control-Allow-Methods': "'POST,OPTIONS'",
                'method.response.header.Access-Control-Allow-Headers': "'Content-Type'",
            }
        )

        # Create POST method
        apigateway_client.put_method(
            restApiId=api_id,
            resourceId=resource_id,
            httpMethod='POST',
            authorizationType='NONE'
        )

        apigateway_client.put_integration(
            restApiId=api_id,
            resourceId=resource_id,
            httpMethod='POST',
            type='AWS_PROXY',
            integrationHttpMethod='POST',
            uri=f'arn:aws:apigateway:{REGION}:lambda:path/2015-03-31/functions/{lambda_arn}/invocations'
        )

        # Give API Gateway permission to invoke Lambda
        lambda_client.add_permission(
            FunctionName=LAMBDA_FUNCTION_NAME,
            StatementId='apigateway-invoke-' + str(int(datetime.now().timestamp())),
            Action='lambda:InvokeFunction',
            Principal='apigateway.amazonaws.com',
            SourceArn=f'arn:aws:execute-api:{REGION}:{account_id}:{api_id}/*/*/*'
        )

        # Deploy API
        apigateway_client.create_deployment(
            restApiId=api_id,
            stageName='prod',
            description='Production deployment'
        )

        print(f"✓ Created API Gateway: {api_id}")

    return api_id


def main():
    """Main deployment flow"""
    print("=" * 60)
    print("AWS API Gateway + Lambda Proxy Deployment")
    print("For ASL SageMaker Serverless Endpoint")
    print("=" * 60)

    # Check AWS credentials
    try:
        sts = boto3.client('sts')
        identity = sts.get_caller_identity()
        account_id = identity['Account']
        print(f"\nAWS Account: {account_id}")
        print(f"Region: {REGION}")
    except Exception as e:
        print(f"\n❌ Error: AWS credentials not configured")
        print(f"   Run: aws configure")
        return

    try:
        # Initialize clients
        iam_client = boto3.client('iam')
        lambda_client = boto3.client('lambda', region_name=REGION)
        apigateway_client = boto3.client('apigateway', region_name=REGION)

        # Step 1: Create Lambda zip
        zip_path = create_lambda_zip()

        # Step 2: Create Lambda role
        role_arn = create_lambda_role(iam_client, account_id)

        # Step 3: Create Lambda function
        lambda_arn = create_lambda_function(lambda_client, role_arn, zip_path)

        # Step 4: Create API Gateway
        api_id = create_api_gateway(apigateway_client, lambda_client, lambda_arn, account_id)

        # Step 5: Get API URL
        api_url = f"https://{api_id}.execute-api.{REGION}.amazonaws.com/prod/predict"

        print("\n" + "=" * 60)
        print("Deployment Complete! 🎉")
        print("=" * 60)
        print(f"\nAPI URL: {api_url}")
        print(f"\nUpdate your frontend .env.local:")
        print(f"  NEXT_PUBLIC_API_URL={api_url}")
        print(f"\nTest the API:")
        print(f"  curl -X POST {api_url} \\")
        print(f'    -H "Content-Type: application/json" \\')
        print(f'    -d \'{{"landmarks": [[0.5,0.5,0.0]...]}}\'')
        print(f"\nCost: ~$0.20 per million requests + SageMaker costs")
        print()

        # Cleanup
        os.remove(zip_path)

    except Exception as e:
        print(f"\n❌ Deployment failed: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    main()
