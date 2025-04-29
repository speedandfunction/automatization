# AWS Application Load Balancer (ALB) Setup

This document describes the configuration and architecture of the AWS Application Load Balancer (ALB) used in the project.

---

## Architecture Diagram

```mermaid
graph TD
    subgraph AWS VPC [VPC: <vpc-id>]
        ALB["ALB: <alb-name><br/>DNS: <alb-dns>"]
        SG["Security Group: <sg-id>"]
        SUBNET1["Subnet: <subnet-1> (AZ-1)"]
        SUBNET2["Subnet: <subnet-2> (AZ-2)"]
        ALB -- in subnets --> SUBNET1
        ALB -- in subnets --> SUBNET2
        ALB -- uses --> SG
    end

    ALB -- "HTTPS:443<br/>SSL: <acm-certificate>" --> LISTENER443["Listener 443 (HTTPS)"]
    LISTENER443 -- "forward" --> TG1["Target Group: n8n-tg<br/>Protocol: HTTP:5678"]
    LISTENER443 -- "forward" --> TG2["Target Group: temporal-tg<br/>Protocol: HTTP:8080"]

    TG1 -- "Targets: EC2 instances<br/>HealthCheck: /" --> EC2A["n8n service"]
    TG2 -- "Targets: EC2 instances<br/>HealthCheck: /" --> EC2B["temporal-ui/oauth2-proxy"]
```

---

## Key Configuration Points

- **ALB Listener:**
  - Port: 443 (HTTPS)
  - SSL certificate: `<acm-certificate>` (managed by AWS ACM)
- **Target Groups:**
  - `n8n-tg`: forwards to n8n service on HTTP port 5678
  - `temporal-tg`: forwards to temporal-ui/oauth2-proxy on HTTP port 8080
- **Health Checks:**
  - Path: `/`
  - Protocol: HTTP
- **Subnets:**
  - ALB is deployed in at least two subnets for high availability (AZ-1, AZ-2)
- **Security Group:**
  - Only allows necessary inbound/outbound traffic (typically HTTPS from the internet)

---

## Useful Links

- [AWS ALB Documentation](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/introduction.html)
- [AWS ACM Documentation](https://docs.aws.amazon.com/acm/latest/userguide/acm-overview.html)
- [Mermaid Live Editor](https://mermaid.live/) (for diagram preview)
