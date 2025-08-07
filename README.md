# Blueprint

**Join our community:** [Discord](https://discord.gg/aT2mYAVVzk) | [Report Issues](https://github.com/BlueprintDesignLab/blueprint/issues)

**Agile development with AI collaborators.**

Current AI tools work great for small tasks, but break down on complex projects. They don't understand how different parts of your codebase fit together, leading to:
- Hours lost fixing integration bugs
- AI overwriting carefully written code  
- Chaotic collaboration between team members and AI

Blueprint Design AI solves this by allowing humans and AI to collaborate on a shared plan, generate a visual architecture graph, then develop components independently with clear boundaries.

![demo video](https://github.com/BlueprintDesignLab/blueprint/blob/main/static/demo.gif)

By generating shared artifacts (plan.md and graph.yaml), Blueprint also reduces the cognitive load on the
user and makes it easier to see what is going on when the AI agent is performing tasks.

Blueprint also aggressively isolates context between different agents, instead opting to
use artifacts as the **source of truth** for shared knowledge. It also implements a `clear`
button handing back to the user so the context window can be minimal. This is to combat
**context rot**, see [Nvidia's research](https://github.com/NVIDIA/RULER) and [Chroma's research](https://research.trychroma.com/context-rot).

Each component in the Blueprint architecture gets its own "expert" agent, which can only
"see" that component, leading to cheaper, faster and more reliable generations.

## 🚀 Quick Start

1. **Download the desktop app** from [releases](https://github.com/BlueprintDesignLab/blueprint/releases)
1.a. **Currently the binaries are not all signed!** If you want to tinker with the application and build it yourself without the security warning:
- Clone the repository
- Run `npm i`
- Run `npm run tauri dev`
- **Note that you must have the prerequisites of Node and Rust installed**

3. **Collaborate with AI** on planning and architecture
4. **Develop with confidence** with expert ai for each component

## 🎯 Key Features

### 📋 Shared Planning
- Collaborative plan.md file that both humans and AI understand
- No more miscommunication about requirements

### 🗺️ Visual Architecture  
- Generate architecture graphs from your plan
- Clear component boundaries and communication paths
- Both humans and AI can read and edit the structure

### 🛡️ Controlled Development
- Work on individual components independently
- Lock handwritten code from AI modification
- AI respects your architecture contracts

### 🤖 AI That Understands Context
- AI works within defined architectural boundaries
- Natural context window management per component
- Predictable, safe collaboration

## 📚 Documentation

- [Interface/Contract Driven Design](docs/interface-contract-dd.md)

## 🚧 Current Status

⚠️ **Alpha Release** - We're actively building and want your feedback!

- [x] Basic plan → architecture workflow  
- [x] Interface/contract driven design system
- [x] Component context isolation
- [x] API compatible with Openai Chat Completion and Anthropic Messages.
- [ ] Template system
- [ ] Additional design systems
- [ ] AI learn from manual file changes

## 🙌 Contributing

We welcome contributions! Check out our [contributing guide (TODO)](CONTRIBUTING.md) to get started.

## 📄 License

MIT License - see [LICENSE](LICENSE) file

---

*Blueprint Loop: Agile Loop Accelerated With AI Collaborators*
