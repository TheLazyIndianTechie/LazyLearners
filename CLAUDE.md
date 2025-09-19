# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**LazyLearners** is a Game Development Learning Management System (LMS) called "GameLearn Platform" - a specialized educational platform combining Udemy's marketplace model with advanced technical capabilities for game development education. The platform emphasizes light, clean, elegant design while providing robust infrastructure for large asset management, real-time collaboration, and integrated development environments.

## Key Features & Architecture

**Core Platform Components:**
- Learning Management System with multi-format content delivery (video, interactive tutorials, assets)
- Game engine integrations (Unity, Unreal Engine, Godot) with WebGL build hosting
- Cloud-based IDEs with real-time collaboration capabilities
- Portfolio and showcase system for student projects
- Assessment and certification system with industry partnerships
- Community features including forums, study groups, and game jams

**Technical Infrastructure:**
- Content Delivery Network with global distribution (100+ edge locations)
- Video streaming with adaptive quality and real-time transcoding
- Container-based cloud development environments (Docker)
- Multi-user collaboration with operational transformation
- WebGL game hosting and cross-platform deployment support

## Development Commands

**Package Management:**
```bash
npm install                    # Install dependencies
```

**ShadCN UI Components:**
```bash
npx shadcn@latest add [component]    # Add UI components
npx shadcn@latest mcp               # MCP server integration
```

## MCP Configuration

The project includes MCP (Model Context Protocol) server configuration for ShadCN UI integration:
- Configuration file: `.mcp.json`
- Server command: `npx shadcn@latest mcp`
- Provides UI component management capabilities

## Project Requirements

Based on the comprehensive PRD (LMS_PRD.md), key development considerations:

**Performance Targets:**
- Page load times: Under 2 seconds
- Video buffer time: Under 2 seconds initial buffer
- Real-time collaboration: Under 150ms latency
- WebGL performance: 30fps minimum
- Support for 10,000+ concurrent users

**Security Requirements:**
- Sandboxed Docker environments for code execution
- End-to-end encryption for sensitive data
- Multi-factor authentication with WebAuthn support
- Comprehensive audit logging

**Integration Requirements:**
- Payment processing (Stripe, PayPal)
- Authentication providers (Google, Microsoft, GitHub SSO)
- Development tools (GitHub, GitLab, Perforce)
- Game engines (Unity Hub, Unreal, Godot)

## Revenue Model

Target: Capture 5% of the $445.94 billion global EdTech market
- Course marketplace with revenue sharing
- Subscription-based access to premium features
- Enterprise licensing for institutions
- Certification program partnerships

## Implementation Phases

**Phase 1 (Months 1-6):** Core platform with video streaming, Unity integration, forums
**Phase 2 (Months 7-12):** Cloud IDEs, real-time collaboration, multi-engine support
**Phase 3 (Months 13-18):** AI/ML features, international expansion, enterprise sales