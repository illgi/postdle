#!/usr/bin/env bash
# postdle 배포 3단계 — ECR 에 이미지가 올라간 뒤 CloudShell(dec)에서 실행.
# App Runner 가 ECR 이미지를 풀 수 있는 역할 + App Runner 서비스(HTTPS 공개 URL) 생성.
set -e
REGION=us-east-1
ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
IMG="${ACCOUNT}.dkr.ecr.${REGION}.amazonaws.com/postdle:latest"

# 1) App Runner 가 ECR 를 읽을 수 있는 액세스 역할
cat > /tmp/apprunner-trust.json <<'EOF'
{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"build.apprunner.amazonaws.com"},"Action":"sts:AssumeRole"}]}
EOF
aws iam create-role --role-name AppRunnerECRAccessRole \
  --assume-role-policy-document file:///tmp/apprunner-trust.json >/dev/null 2>&1 \
  && echo "AppRunnerECRAccessRole 생성" || echo "역할 이미 있음"
aws iam attach-role-policy --role-name AppRunnerECRAccessRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess

# 2) App Runner 서비스 생성 (포트 3000, env 주입, ECR :latest 자동배포)
aws apprunner create-service --region "$REGION" \
  --service-name postdle \
  --source-configuration "{\"ImageRepository\":{\"ImageIdentifier\":\"${IMG}\",\"ImageRepositoryType\":\"ECR\",\"ImageConfiguration\":{\"Port\":\"3000\",\"RuntimeEnvironmentVariables\":{\"PAGEDLE_API\":\"https://api.pagedle.com/api/v1\",\"NEXT_PUBLIC_ROOT_DOMAIN\":\"postdle.com\",\"HOSTNAME\":\"0.0.0.0\"}}},\"AutoDeploymentsEnabled\":true,\"AuthenticationConfiguration\":{\"AccessRoleArn\":\"arn:aws:iam::${ACCOUNT}:role/AppRunnerECRAccessRole\"}}" \
  --instance-configuration '{"Cpu":"1024","Memory":"2048"}' \
  --health-check-configuration '{"Protocol":"HTTP","Path":"/","Interval":10,"Timeout":5,"HealthyThreshold":1,"UnhealthyThreshold":5}'

echo ""
echo "생성 요청 완료. 잠시 후 서비스 URL 확인:"
echo "aws apprunner list-services --region $REGION --query \"ServiceSummaryList[?ServiceName=='postdle'].ServiceUrl\" --output text"
