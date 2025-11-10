"""
AWS Lambda function to proxy requests to SageMaker endpoint
This allows browser clients to use SageMaker without AWS credentials
"""

import json
import boto3
import os

# Initialize SageMaker runtime client
sagemaker_runtime = boto3.client('sagemaker-runtime')

# Get endpoint name from environment variable
ENDPOINT_NAME = os.environ.get('SAGEMAKER_ENDPOINT', 'asl-inference-serverless')


def lambda_handler(event, context):
    """
    Lambda handler function
    Accepts POST requests with landmarks and returns predictions
    """

    # Handle CORS preflight requests
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            'body': ''
        }

    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        landmarks = body.get('landmarks')

        if not landmarks:
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json',
                },
                'body': json.dumps({
                    'error': 'Missing landmarks in request body'
                })
            }

        # Validate landmarks
        if len(landmarks) != 21:
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json',
                },
                'body': json.dumps({
                    'error': f'Expected 21 landmarks, got {len(landmarks)}'
                })
            }

        # Call SageMaker endpoint
        response = sagemaker_runtime.invoke_endpoint(
            EndpointName=ENDPOINT_NAME,
            ContentType='application/json',
            Body=json.dumps({'landmarks': landmarks})
        )

        # Parse response
        result = json.loads(response['Body'].read().decode())

        # Return successful response
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
            },
            'body': json.dumps(result)
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
            },
            'body': json.dumps({
                'error': f'Internal server error: {str(e)}'
            })
        }
