# 📖 Adding New Script Guide

This document will guide you through adding new userscripts to the `vite-monkey-scripts` project.

## 🏗️ Project Structure

```
vite-monkey-scripts/
├── packages/                    # Scripts packages directory
│   ├── script-name/            # Individual script directory
│   │   ├── config.ts           # Script configuration
│   │   ├── index.ts            # Script entry file
│   │   ├── styles/             # Styles directory
│   │   │   └── styles.ts       # Style file
│   │   ├── components/         # Vue components (optional)
│   │   └── types.ts            # Type definitions (optional)
├── project.config.ts           # Main project configuration
├── package.json               # Project dependencies and scripts
└── docs/                      # Documentation directory
```

## 🚀 Steps to Add New Script

### Step 1: Create Script Directory

Create a new script directory under `packages/`:

```bash
mkdir packages/your-script-name
```

### Step 2: Create Configuration File

Create `packages/your-script-name/config.ts`:

```typescript
import type { MonkeyOption } from 'vite-plugin-monkey'

const config: MonkeyOption = {
  entry: './packages/your-script-name/index.ts',
  userscript: {
    version: '0.0.1',
    'run-at': 'document-idle' as const,
    match: ['https://example.com/*'], // Replace with target website
    description: 'Your script description',
    license: 'MIT',
    name: 'your-script-name',
    // Optional configurations
    require: [
      // 'https://cdn.jsdelivr.net/npm/library@version'
    ],
    grant: [
      // 'GM_addStyle',
      // 'GM_setValue',
      // 'GM_getValue'
    ],
  },
  build: {
    fileName: 'your-script-name.user.js',
  },
}

export default config
```

### Step 3: Create Style File

Create `packages/your-script-name/styles/styles.ts`:

```typescript
GM_addStyle(`
/* Your CSS styles */
.your-custom-class {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
  padding: 10px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.your-button {
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.your-button:hover {
  background: #0056b3;
}
`)
```

### Step 4: Create Main Entry File

Create `packages/your-script-name/index.ts`:

```typescript
import './styles/styles'

// Configuration object
const CONFIG = {
  targetSelector: '.target-element',
  buttonClass: 'your-custom-button',
}

// Main class
class YourScriptManager {
  private isInitialized = false

  constructor() {
    this.init()
  }

  private init() {
    if (this.isInitialized) return

    console.log('Your script initialized')
    this.createUI()
    this.bindEvents()
    this.isInitialized = true
  }

  private createUI() {
    // Create UI elements
    const button = document.createElement('button')
    button.className = CONFIG.buttonClass
    button.textContent = 'Click Me'
    button.title = 'Script functionality description'

    document.body.appendChild(button)
  }

  private bindEvents() {
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      if (target.classList.contains(CONFIG.buttonClass)) {
        this.handleButtonClick()
      }
    })
  }

  private handleButtonClick() {
    console.log('Button clicked')
    // Implement your functionality logic here
  }
}

// Initialize script
new YourScriptManager()
```

### Step 5: Update Project Configuration

Edit `project.config.ts` to add the new script import and configuration:

```typescript
import codesignCssToTailwind from './packages/codesign-css-to-tailwind/config.ts'
import copyMultiZentaoBugId from './packages/copy-multi-zentao-bug-id/config.ts'
import yourScriptName from './packages/your-script-name/config.ts' // Add this

export default {
  codesignCssToTailwind,
  copyMultiZentaoBugId,
  yourScriptName, // Add this
}
```

### Step 6: Update package.json

Add development and build commands to the `scripts` section in `package.json`:

```json
{
  "scripts": {
    "dev:your-script-name": "vite --mode yourScriptName",
    "build:your-script-name": "vite build --mode yourScriptName"
  }
}
```

## 🛠️ Development and Building

### Development Mode

```bash
pnpm dev:your-script-name
```

### Build Production Version

```bash
pnpm build:your-script-name
```

### Build All Scripts

```bash
pnpm build
```

## 📝 Configuration Options

### userscript Configuration

| Option        | Description                          | Example                                                            |
| ------------- | ------------------------------------ | ------------------------------------------------------------------ |
| `match`       | Target websites for script execution | `['https://example.com/*']`                                        |
| `name`        | Script name                          | `'my-awesome-script'`                                              |
| `description` | Script description                   | `'This is an awesome script'`                                      |
| `version`     | Script version                       | `'1.0.0'`                                                          |
| `run-at`      | Script execution timing              | `'document-idle'`                                                  |
| `require`     | External dependencies                | `['https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js']` |
| `grant`       | Permission requests                  | `['GM_addStyle', 'GM_setValue']`                                   |

### Execution Timing Options

- `document-start`: When document starts loading
- `document-body`: When body element exists
- `document-end`: When DOM loading completes
- `document-idle`: After page loading completes (recommended)

## 🎯 Best Practices

### 1. Naming Conventions

- Use kebab-case for script directories: `awesome-script`
- Use camelCase for config mode: `awesomeScript`
- Use prefixes for CSS classes to avoid conflicts: `awesome-script-button`

### 2. Code Structure

- Use classes to encapsulate script logic
- Separate configuration, styles, and functionality code
- Add necessary error handling

### 3. Style Management

- Use `GM_addStyle` to inject styles
- Add high z-index to ensure UI display
- Use responsive design for different screen sizes

### 4. Performance Optimization

- Avoid DOM operations in loops
- Use event delegation for dynamic elements
- Clean up unnecessary listeners promptly

## 🔧 Utility Functions

The project provides common utility functions in the `utils/` directory:

- `copyToClipboard.ts`: Copy text to clipboard
- `message.ts`: Display message notifications
- `waitElement.ts`: Wait for element to appear
- `css-to-tailwind.ts`: CSS to Tailwind converter

Usage examples:

```typescript
import { copyToClipboard } from '../../utils/copyToClipboard'
import { message } from '../../utils/message'
import { waitElement } from '../../utils/waitElement'

// Copy text
copyToClipboard('Text to copy')

// Show messages
message.success('Operation successful')
message.error('Operation failed')

// Wait for element
const element = await waitElement('.target-selector')
```

## 🚨 Important Notes

1. **Permission Requests**: Using `GM_*` APIs requires declaration in `grant`
2. **Cross-origin Requests**: Need to declare allowed domains in `connect`
3. **Style Isolation**: Use specific class prefixes to avoid style conflicts
4. **Compatibility**: Ensure code runs properly in target website's browser environment
5. **Performance**: Avoid blocking main thread, consider `requestAnimationFrame` for heavy operations

## 🔍 Debugging Tips

1. **Developer Tools**: Use browser developer tools for debugging
2. **Console Logs**: Add appropriate `console.log` to track execution flow
3. **Error Handling**: Use `try-catch` to capture and handle errors
4. **Hot Reload**: Automatic reload in development mode for easy debugging

## 📚 Reference Resources

- [Vite Plugin Monkey Documentation](https://github.com/lisonge/vite-plugin-monkey)
- [Tampermonkey Documentation](https://www.tampermonkey.net/documentation.php)
- [Greasemonkey API](https://wiki.greasespot.net/Greasemonkey_Manual:API)
- [Vue 3 Documentation](https://vuejs.org/)

---

🎉 Congratulations! You've learned how to add new userscripts to the project. If you have questions, please refer to existing script implementations for guidance.
