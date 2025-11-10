# AWS SageMaker Serverless - Quick Start Guide

Deploy your ASL model to AWS SageMaker with **auto-start/stop** in ~30 minutes.

## What You Get

✅ **Auto-starts** on recruiter visit (10-20 sec first request)
✅ **Auto-stops** after idle (scales to zero)
✅ **Pay per use** ($0.20/second active, $0 idle)
✅ **GPU inference** (5-15ms latency when warm)
✅ **No server management** (fully managed by AWS)

---

## Prerequisites

- AWS Account ([free tier available](https://aws.amazon.com/free/))
- AWS CLI installed
- Python 3.8+ installed

---

## Step 1: Install AWS CLI & Configure (5 min)

### Install AWS CLI:

**Mac:**
```bash
brew install awscli
```

**Windows:**
Download from: https://aws.amazon.com/cli/

**Linux:**
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

### Configure AWS Credentials:

```bash
aws configure
```

Enter when prompted:
```
AWS Access Key ID: (from AWS Console → IAM → Users → Security credentials)
AWS Secret Access Key: (from above)
Default region name: us-east-1
Default output format: json
```

### Create SageMaker Execution Role:

```bash
# Create trust policy
cat > trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "sagemaker.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create role
aws iam create-role \
  --role-name SageMakerExecutionRole \
  --assume-role-policy-document file://trust-policy.json

# Attach policies
aws iam attach-role-policy \
  --role-name SageMakerExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonSageMakerFullAccess

aws iam attach-role-policy \
  --role-name SageMakerExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

echo "✓ SageMaker role created!"
```

---

## Step 2: Deploy to SageMaker (10 min)

### Install Dependencies:

```bash
cd sagemaker-deploy

# Install deployment requirements
pip install -r requirements-deploy.txt
```

### Run Deployment Script:

```bash
python deploy.py
```

**What happens:**
1. ✅ Packages model files into tar.gz
2. ✅ Creates S3 bucket (if needed)
3. ✅ Uploads model to S3
4. ✅ Creates SageMaker model
5. ✅ Deploys serverless endpoint
6. ✅ Tests endpoint with sample data

**Time**: ~5-10 minutes (most time is SageMaker deployment)

**Expected Output:**
```
====================================
AWS SageMaker Serverless Deployment
ASL Inference Model
====================================

AWS Account: 123456789012
Region: us-east-1

[1/5] Packaging model files...
  Added: inference.py → code/inference.py
  Added: requirements.txt → code/requirements.txt
  Added: model.onnx → model.onnx
  Added: labels.json → labels.json
✓ Model package created: model.tar.gz

[2/5] Uploading to S3...
✓ Uploaded to: s3://asl-inference-models/models/...

[3/5] Creating SageMaker model...
✓ Model created: asl-inference-20241210-143022

[4/5] Deploying serverless endpoint...
  This may take 5-10 minutes...
✓ Endpoint deployed: asl-inference-serverless

[5/5] Testing endpoint...
  Sending test request...
  (First request may take 10-20 seconds - cold start)

  Response:
  {
    "sign": "A",
    "confidence": 0.87,
    "probabilities": {
      "A": 0.87,
      "B": 0.05,
      ...
    }
  }

✓ Endpoint is working!

====================================
Deployment Complete! 🎉
====================================

Endpoint Name: asl-inference-serverless
Region: us-east-1

Update your frontend .env.local:
  NEXT_PUBLIC_SAGEMAKER_ENDPOINT=asl-inference-serverless
  NEXT_PUBLIC_AWS_REGION=us-east-1
```

---

## Step 3: Update Frontend (2 min)

```bash
cd frontend

# Create .env.local
cat > .env.local << EOF
NEXT_PUBLIC_SAGEMAKER_ENDPOINT=asl-inference-serverless
NEXT_PUBLIC_AWS_REGION=us-east-1
EOF

# Restart dev server
npm run dev
```

---

## Step 4: Test It! (2 min)

1. **Visit**: http://localhost:3000/practice
2. **Click**: "Start Camera"
3. **Make**: An ASL sign
4. **Check console** (F12):
   ```
   Using AWS SageMaker inference...
   SageMaker inference completed in 15234ms  (first time - cold start)
   ```

5. **Make another sign**:
   ```
   Using AWS SageMaker inference...
   SageMaker inference completed in 156ms  (warm - fast!)
   ```

✅ **It's working!** SageMaker auto-started on first request!

---

## How It Works

### First Recruiter Visit (Cold Start):
```
1. Recruiter visits site
2. Makes ASL sign
3. Frontend calls SageMaker endpoint
4. SageMaker starts container (~10-15 sec)
5. Loads model (~2-5 sec)
6. Runs inference (~0.1 sec)
7. Returns prediction
Total: ~15-20 seconds
```

### Subsequent Requests (Warm):
```
1. Recruiter makes another sign
2. Container already running
3. Runs inference (~0.1 sec)
4. Returns prediction
Total: ~0.1-0.2 seconds (fast!)
```

### After Idle (15 minutes):
```
1. No requests for 15 minutes
2. SageMaker scales container to zero
3. Billing stops ($0/hour)
4. Next request triggers cold start again
```

---

## Cost Breakdown

### Pricing:
```
Active compute: $0.20 per second
Memory (4GB): $0.000004 per MB-second
Idle: $0.00

Per prediction:
- Cold start: 15 sec × $0.20 = $3.00 (first request after idle)
- Warm request: 0.1 sec × $0.20 = $0.02
```

### Monthly Estimates:

**Low Traffic (10 recruiter visits/month):**
```
Cold starts: 10 × $3.00 = $30.00
Monthly total: ~$30/month
```

**Medium Traffic (50 visits/month):**
```
Assume 10 cold starts, 40 warm requests:
Cold starts: 10 × $3.00 = $30.00
Warm requests: 40 × $0.02 = $0.80
Monthly total: ~$31/month
```

**High Traffic (200 visits/month):**
```
Assume 20 cold starts, 180 warm requests:
Cold starts: 20 × $3.00 = $60.00
Warm requests: 180 × $0.02 = $3.60
Monthly total: ~$64/month
```

**Note**: Cold starts happen ~1 per idle period (15 min). If traffic is consistent, you'll have fewer cold starts!

---

## Monitor & Manage

### View Endpoint in AWS Console:

```
1. Go to: https://console.aws.amazon.com/sagemaker/
2. Click: Endpoints
3. Find: asl-inference-serverless
4. View: Status, metrics, logs
```

### Check Costs:

```
AWS Console → Cost Management → Cost Explorer
Filter by: Service = SageMaker
```

### View Logs:

```
AWS Console → CloudWatch → Log groups
Find: /aws/sagemaker/Endpoints/asl-inference-serverless
```

---

## Troubleshooting

### Issue: Deployment Failed

**Error: "Role not found"**
```bash
# Make sure you created the role:
aws iam get-role --role-name SageMakerExecutionRole

# If not found, run Step 1 again
```

**Error: "Access denied"**
```bash
# Check AWS credentials:
aws sts get-caller-identity

# Should show your account ID
```

### Issue: Endpoint Not Responding

```bash
# Check endpoint status:
aws sagemaker describe-endpoint \
  --endpoint-name asl-inference-serverless

# Status should be "InService"
```

### Issue: Cold Start Too Slow

This is normal! First request after idle takes 10-20 seconds.

**Solutions:**
- Accept it (cost $0 when idle)
- Or keep warm with periodic pings (costs more)
- Or use EC2 Spot 24/7 instead ($63/month, always fast)

### Issue: Frontend Not Connecting

```bash
# Check environment variables:
cat frontend/.env.local

# Should have:
# NEXT_PUBLIC_SAGEMAKER_ENDPOINT=asl-inference-serverless
# NEXT_PUBLIC_AWS_REGION=us-east-1

# Restart frontend:
cd frontend
npm run dev
```

---

## Delete Endpoint (Stop Billing)

When done testing or if you want to remove it:

```bash
# Delete endpoint
aws sagemaker delete-endpoint \
  --endpoint-name asl-inference-serverless

# Delete endpoint config
aws sagemaker delete-endpoint-config \
  --endpoint-config-name asl-inference-serverless

# Delete model (optional)
aws sagemaker delete-model \
  --model-name asl-inference-YYYYMMDD-HHMMSS

echo "✓ Endpoint deleted, billing stopped"
```

**Cost after deletion**: $0/month (just S3 storage ~$0.50/month)

---

## Comparison with Other Options

| Option | Monthly Cost | Cold Start | Always Fast | Setup Time |
|--------|-------------|------------|-------------|------------|
| **SageMaker Serverless** | **$10-30** | **15 sec** | ❌ | **30 min** |
| EC2 Spot 24/7 | $63 | 0 sec | ✅ | 20 min |
| Azure Spot 24/7 | $63 | 0 sec | ✅ | 20 min |
| Browser WebGL | $0 | 0 sec | ✅ | 0 min |

**Best for**:
- SageMaker: Low traffic, unpredictable visits, minimize cost
- EC2/Azure Spot: High traffic, need always fast, can afford $63
- Browser: Development, testing, free forever

---

## Next Steps

1. ✅ **Test thoroughly**: Make sure it works for your use case
2. ✅ **Deploy to production**: Update your production env vars
3. ✅ **Monitor costs**: Check AWS Cost Explorer weekly
4. ✅ **Share with recruiters**: Your site auto-scales!

---

## Production Deployment

For production (Vercel/Netlify):

```bash
# Vercel
vercel env add NEXT_PUBLIC_SAGEMAKER_ENDPOINT
# Enter: asl-inference-serverless

vercel env add NEXT_PUBLIC_AWS_REGION
# Enter: us-east-1

vercel --prod

# Netlify
netlify env:set NEXT_PUBLIC_SAGEMAKER_ENDPOINT asl-inference-serverless
netlify env:set NEXT_PUBLIC_AWS_REGION us-east-1
netlify deploy --prod
```

---

## Summary

**Setup Time**: ~30 minutes
**Monthly Cost**: $10-30 (low traffic)
**Cold Start**: 10-20 seconds
**Warm Latency**: 5-15ms
**Maintenance**: Zero (fully managed)

**Perfect for**: Portfolio demos with unpredictable recruiter visits! 🎯

You're all set! Your ASL inference now auto-scales with AWS SageMaker! 🚀
