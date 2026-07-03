#!/usr/bin/env bash
# postdle 배포 1단계 — dec 계정(227755137186) CloudShell 에 붙여넣어 실행.
# ECR 레포 + GitHub OIDC + GitHub Actions 용 IAM 역할 생성. 마지막에 AWS_ROLE_ARN 출력.
set -e
REGION=us-east-1
ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
echo "Account: $ACCOUNT (기대값 227755137186)"

# 1) ECR 프라이빗 레포
aws ecr create-repository --repository-name postdle --region "$REGION" >/dev/null 2>&1 \
  && echo "ECR 'postdle' 생성" || echo "ECR 'postdle' 이미 있음"

# 2) GitHub OIDC 자격증명 공급자 (있으면 스킵)
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1 >/dev/null 2>&1 \
  && echo "OIDC provider 생성" || echo "OIDC provider 이미 있음"

# 3) GitHub Actions 가 assume 할 역할 (repo:illgi/postdle:* 만 신뢰)
cat > /tmp/postdle-trust.json <<EOF
{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Federated":"arn:aws:iam::${ACCOUNT}:oidc-provider/token.actions.githubusercontent.com"},"Action":"sts:AssumeRoleWithWebIdentity","Condition":{"StringEquals":{"token.actions.githubusercontent.com:aud":"sts.amazonaws.com"},"StringLike":{"token.actions.githubusercontent.com:sub":"repo:illgi/postdle:*"}}}]}
EOF
aws iam create-role --role-name postdle-gha \
  --assume-role-policy-document file:///tmp/postdle-trust.json >/dev/null 2>&1 \
  && echo "역할 postdle-gha 생성" || echo "역할 postdle-gha 이미 있음"

# 4) ECR push 권한 부여 (이미지 빌드→푸시용)
aws iam attach-role-policy --role-name postdle-gha \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser

echo ""
echo "==================================================================="
echo "AWS_ROLE_ARN = arn:aws:iam::${ACCOUNT}:role/postdle-gha"
echo "==================================================================="
echo "이 값을 GitHub illgi/postdle → Settings → Secrets → Actions 에"
echo "AWS_ROLE_ARN 이름으로 추가하세요."
