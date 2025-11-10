#!/usr/bin/env python3
"""
AWS SageMaker Serverless Deployment Script
Automates the deployment of ASL inference model to SageMaker
"""

import boto3
import sagemaker
from sagemaker.pytorch import PyTorchModel
from sagemaker.serverless import ServerlessInferenceConfig
import tarfile
import os
import json
from datetime import datetime

# Configuration
BUCKET_NAME = 'asl-inference-models'  # Will be created if doesn't exist
MODEL_NAME = 'asl-inference'
ENDPOINT_NAME = 'asl-inference-serverless'
REGION = 'us-east-1'  # Change to your preferred region


def create_s3_bucket(bucket_name, region):
    """Create S3 bucket if it doesn't exist"""
    s3_client = boto3.client('s3', region_name=region)

    try:
        s3_client.head_bucket(Bucket=bucket_name)
        print(f"✓ S3 bucket '{bucket_name}' already exists")
    except:
        print(f"Creating S3 bucket '{bucket_name}'...")
        if region == 'us-east-1':
            s3_client.create_bucket(Bucket=bucket_name)
        else:
            s3_client.create_bucket(
                Bucket=bucket_name,
                CreateBucketConfiguration={'LocationConstraint': region}
            )
        print(f"✓ S3 bucket created")


def package_model():
    """Package model files into tar.gz"""
    print("\n[1/5] Packaging model files...")

    # Files to include
    files = [
        ('inference.py', 'code/inference.py'),
        ('requirements.txt', 'code/requirements.txt'),
        ('../frontend/public/models/model.onnx', 'model.onnx'),
        ('../frontend/public/models/labels.json', 'labels.json')
    ]

    # Create tar.gz
    tar_path = 'model.tar.gz'
    with tarfile.open(tar_path, 'w:gz') as tar:
        for src, dst in files:
            if os.path.exists(src):
                tar.add(src, arcname=dst)
                print(f"  Added: {src} → {dst}")
            else:
                print(f"  ⚠ Warning: {src} not found, skipping")

    print(f"✓ Model package created: {tar_path}")
    return tar_path


def upload_to_s3(tar_path, bucket_name, region):
    """Upload model package to S3"""
    print(f"\n[2/5] Uploading to S3...")

    s3_client = boto3.client('s3', region_name=region)

    # Create bucket if needed
    create_s3_bucket(bucket_name, region)

    # Upload file
    s3_key = f'models/{MODEL_NAME}/{datetime.now().strftime("%Y%m%d-%H%M%S")}/model.tar.gz'
    s3_client.upload_file(tar_path, bucket_name, s3_key)

    s3_uri = f's3://{bucket_name}/{s3_key}'
    print(f"✓ Uploaded to: {s3_uri}")
    return s3_uri


def create_sagemaker_model(s3_uri, role, region):
    """Create SageMaker model"""
    print(f"\n[3/5] Creating SageMaker model...")

    # Get PyTorch inference image URI for CPU (serverless uses CPU)
    image_uri = sagemaker.image_uris.retrieve(
        framework='pytorch',
        region=region,
        version='2.0.0',
        py_version='py310',
        instance_type='ml.m5.xlarge',  # CPU instance for serverless
        image_scope='inference'
    )

    print(f"  Using image: {image_uri}")

    # Create model
    model = PyTorchModel(
        model_data=s3_uri,
        role=role,
        image_uri=image_uri,
        framework_version='2.0.0',
        py_version='py310',
        entry_point='inference.py',
        name=f'{MODEL_NAME}-{datetime.now().strftime("%Y%m%d-%H%M%S")}'
    )

    print(f"✓ Model created: {model.name}")
    return model


def deploy_serverless(model, endpoint_name):
    """Deploy model with serverless inference"""
    print(f"\n[4/5] Deploying serverless endpoint...")
    print(f"  This may take 5-10 minutes...")

    # Configure serverless inference
    serverless_config = ServerlessInferenceConfig(
        memory_size_in_mb=3072,  # 3GB memory (AWS account limit)
        max_concurrency=5,       # Max concurrent requests
    )

    try:
        # Deploy
        predictor = model.deploy(
            serverless_inference_config=serverless_config,
            endpoint_name=endpoint_name
        )

        print(f"✓ Endpoint deployed: {endpoint_name}")
        return predictor

    except Exception as e:
        if "already exists" in str(e):
            print(f"⚠ Endpoint '{endpoint_name}' already exists")
            print(f"  Delete it first or use a different name")
            return None
        raise


def test_endpoint(endpoint_name, region):
    """Test the deployed endpoint"""
    print(f"\n[5/5] Testing endpoint...")

    runtime = boto3.client('sagemaker-runtime', region_name=region)

    # Test data (21 landmarks with random values)
    test_landmarks = [
        [0.5, 0.5, 0.0], [0.6, 0.4, -0.1], [0.7, 0.3, -0.2],
        [0.8, 0.2, -0.3], [0.9, 0.1, -0.4], [0.4, 0.6, 0.0],
        [0.3, 0.7, 0.1], [0.2, 0.8, 0.2], [0.1, 0.9, 0.3],
        [0.4, 0.7, 0.0], [0.3, 0.8, 0.1], [0.2, 0.9, 0.2],
        [0.1, 1.0, 0.3], [0.5, 0.8, 0.0], [0.4, 0.9, 0.1],
        [0.3, 1.0, 0.2], [0.2, 1.1, 0.3], [0.6, 0.9, 0.0],
        [0.5, 1.0, 0.1], [0.4, 1.1, 0.2], [0.3, 1.2, 0.3]
    ]

    payload = json.dumps({'landmarks': test_landmarks})

    print(f"  Sending test request...")
    print(f"  (First request may take 10-20 seconds - cold start)")

    response = runtime.invoke_endpoint(
        EndpointName=endpoint_name,
        ContentType='application/json',
        Body=payload
    )

    result = json.loads(response['Body'].read().decode())

    print(f"\n  Response:")
    print(f"  {json.dumps(result, indent=2)}")
    print(f"\n✓ Endpoint is working!")


def get_endpoint_url(endpoint_name, region):
    """Get the endpoint URL"""
    return f"https://runtime.sagemaker.{region}.amazonaws.com/endpoints/{endpoint_name}/invocations"


def main():
    """Main deployment flow"""
    print("=" * 60)
    print("AWS SageMaker Serverless Deployment")
    print("ASL Inference Model")
    print("=" * 60)

    # Check AWS credentials
    try:
        sts = boto3.client('sts')
        identity = sts.get_caller_identity()
        print(f"\nAWS Account: {identity['Account']}")
        print(f"Region: {REGION}")
    except Exception as e:
        print(f"\n❌ Error: AWS credentials not configured")
        print(f"   Run: aws configure")
        return

    # Get SageMaker execution role
    try:
        # Try to get role from SageMaker notebook environment
        role = sagemaker.get_execution_role()
        print(f"SageMaker Role: {role}")
    except:
        # If not in SageMaker notebook, construct role ARN from account ID
        try:
            iam_client = boto3.client('iam')
            role_name = 'SageMakerExecutionRole'

            # Check if role exists
            iam_client.get_role(RoleName=role_name)

            # Construct role ARN
            role = f"arn:aws:iam::{identity['Account']}:role/{role_name}"
            print(f"SageMaker Role: {role}")
        except Exception as e:
            print(f"\n❌ Error: No SageMaker execution role found")
            print(f"   Create one with:")
            print(f"   aws iam create-role --role-name SageMakerExecutionRole --assume-role-policy-document file://trust-policy.json")
            print(f"   aws iam attach-role-policy --role-name SageMakerExecutionRole --policy-arn arn:aws:iam::aws:policy/AmazonSageMakerFullAccess")
            return

    try:
        # Step 1: Package model
        tar_path = package_model()

        # Step 2: Upload to S3
        s3_uri = upload_to_s3(tar_path, BUCKET_NAME, REGION)

        # Step 3: Create SageMaker model
        model = create_sagemaker_model(s3_uri, role, REGION)

        # Step 4: Deploy serverless endpoint
        predictor = deploy_serverless(model, ENDPOINT_NAME)

        if predictor:
            # Step 5: Test endpoint
            test_endpoint(ENDPOINT_NAME, REGION)

            # Print summary
            print("\n" + "=" * 60)
            print("Deployment Complete! 🎉")
            print("=" * 60)
            print(f"\nEndpoint Name: {ENDPOINT_NAME}")
            print(f"Region: {REGION}")
            print(f"\nEndpoint URL:")
            print(f"  {get_endpoint_url(ENDPOINT_NAME, REGION)}")
            print(f"\nUpdate your frontend .env.local:")
            print(f"  NEXT_PUBLIC_SAGEMAKER_ENDPOINT={ENDPOINT_NAME}")
            print(f"  NEXT_PUBLIC_AWS_REGION={REGION}")
            print(f"\nCost Estimate:")
            print(f"  Active: $0.20/second")
            print(f"  Idle: $0/hour (scales to zero!)")
            print(f"  Per prediction: ~$0.02 (after warm-up)")
            print(f"\nMonitor endpoint:")
            print(f"  AWS Console → SageMaker → Endpoints → {ENDPOINT_NAME}")
            print()

    except Exception as e:
        print(f"\n❌ Deployment failed: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    main()
