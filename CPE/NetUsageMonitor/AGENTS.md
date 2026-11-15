# NetUsageMonitor - Project Agents

## Overview
.NET 8 WPF network monitoring app with Clean Architecture, EF Core, SNMP, MaterialDesign.

## Agent Usage
- **planner**: New monitoring features, architecture decisions
- **tdd-guide**: xUnit unit tests, Moq, FluentAssertions; integration tests with Testcontainers
- **code-reviewer**: C#/.NET code quality, nullable refs, async/await patterns
- **security-reviewer**: CredentialStore (DPAPI), SNMP input validation, polling rate limits
- **build-error-resolver**: `dotnet build` failures, EF Core migration issues
- **database-reviewer**: EF Core queries, indexes, migrations, RLS patterns

## Project Context
- Solution: `NetUsageMonitor.sln` with 7 projects
- Layers: Core, Data, Services, Snmp, Wpf, Tests, IntegrationTests
- DI: `Microsoft.Extensions.DependencyInjection`
- MVVM: `CommunityToolkit.Mvvm`
- Build: `dotnet build`, `dotnet test`, `dotnet ef migrations add`

## ECC Compliance
- Uses global ECC agents, commands, skills
- .NET-specific patterns in CLAUDE.md