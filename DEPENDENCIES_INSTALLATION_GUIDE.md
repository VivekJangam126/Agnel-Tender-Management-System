# Dependencies & Package Installation Guide

## 📦 RAG System Dependencies

The RAG system requires two additional npm packages beyond the current setup:

### Required Packages

#### 1. **pdf-parse** (1.1.1)
- **Purpose**: Extract text from PDF files
- **Size**: ~2MB
- **Use in RAG**: `pdf-extractor.js`
- **Installation**: `npm install pdf-parse`

#### 2. **node-fetch** (3.x)
- **Purpose**: Make HTTP requests to Ollama and other services
- **Size**: ~500KB
- **Use in RAG**: `embedding.service.js` (Ollama calls)
- **Installation**: `npm install node-fetch`

---

## 🔧 Installation Instructions

### Option 1: Install Individually

```bash
cd server
npm install pdf-parse
npm install node-fetch
```

### Option 2: Install Both at Once

```bash
cd server
npm install pdf-parse node-fetch
```

### Option 3: Update package.json Manually

Add these to your `server/package.json` dependencies section:

```json
{
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "docx": "^9.5.1",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "express-rate-limit": "^8.2.1",
    "jsonwebtoken": "^9.0.2",
    "morgan": "^1.10.0",
    "pdfkit": "^0.17.2",
    "pg": "^8.11.3",
    "pdf-parse": "^1.1.1",
    "node-fetch": "^3.3.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

Then run:
```bash
npm install
```

---

## ✅ Verification

### Check Installation

```bash
# List installed packages
npm list pdf-parse node-fetch

# Expected output:
# ├── node-fetch@3.3.2
# └── pdf-parse@1.1.1
```

### Verify Imports Work

```bash
# Test pdf-parse
node -e "import('pdf-parse').then(() => console.log('✓ pdf-parse OK'))"

# Test node-fetch
node -e "import('node-fetch').then(() => console.log('✓ node-fetch OK'))"
```

### Test RAG Services Load

```bash
node -e "
import('./src/services/rag/pdf-extractor.js').then(() => console.log('✓ pdf-extractor OK'));
import('./src/services/rag/embedding.service.js').then(() => console.log('✓ embedding.service OK'));
"
```

---

## 📋 Complete Updated package.json

Here's the complete updated `package.json` with RAG dependencies included:

```json
{
  "name": "tms-server",
  "version": "0.0.1",
  "description": "Tender Management System with RAG-powered AI Analysis",
  "private": true,
  "type": "module",
  "main": "src/server.js",
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "test": "node src/db/test-rag-system.js",
    "setup": "node setup-rag-system.js",
    "migrate": "node src/db/runMigrations.js",
    "seed": "node src/db/seed.js"
  },
  "keywords": [
    "tender",
    "management",
    "rag",
    "ai",
    "retrieval-augmented-generation"
  ],
  "author": "Your Team",
  "license": "MIT",
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "docx": "^9.5.1",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "express-rate-limit": "^8.2.1",
    "jsonwebtoken": "^9.0.2",
    "morgan": "^1.10.0",
    "pdfkit": "^0.17.2",
    "pg": "^8.11.3",
    "pdf-parse": "^1.1.1",
    "node-fetch": "^3.3.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

---

## 🚀 Post-Installation Setup

After installing dependencies, ensure:

1. **Create data directories**
   ```bash
   mkdir -p data/global_pdfs
   mkdir -p data/sessions
   ```

2. **Configure environment**
   ```bash
   # Add to .env
   DATABASE_URL=your_connection_string
   GROQ_API_KEY=your_api_key
   ```

3. **Run setup validation**
   ```bash
   node setup-rag-system.js
   ```

4. **Start server**
   ```bash
   npm run dev
   ```

---

## 📊 Dependency Details

### pdf-parse

**What it does:**
- Extracts text from PDF files
- Handles multi-page documents
- Preserves document structure

**Used by:**
- `src/services/rag/pdf-extractor.js`

**Example usage:**
```javascript
import pdfParse from 'pdf-parse';
import fs from 'fs';

const file = fs.readFileSync('document.pdf');
const data = await pdfParse(file);
console.log(data.text); // Extracted text
```

**Alternatives:**
- `pdfjs-dist` (more lightweight)
- `pdf2json` (more features)

---

### node-fetch

**What it does:**
- Makes HTTP requests from Node.js
- Supports fetch API (same as browser)
- Required for Ollama API calls

**Used by:**
- `src/services/rag/embedding.service.js` (Ollama calls)
- `src/routes/rag.routes.js` (Groq API calls)

**Example usage:**
```javascript
import fetch from 'node-fetch';

const response = await fetch('http://localhost:11434/api/embeddings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ model: 'nomic-embed-text', prompt: 'text' })
});
```

**Note:**
- Node.js v18+ has built-in fetch, but we explicitly install `node-fetch` for consistency across versions

---

## 🔄 Dependency Conflicts

### No Known Conflicts

The RAG system dependencies (`pdf-parse`, `node-fetch`) are compatible with:
- ✅ All existing dependencies
- ✅ Node.js 18+
- ✅ PostgreSQL drivers
- ✅ Express.js
- ✅ Authentication middleware

### Version Compatibility

| Package | Version | Node.js | Issues |
|---------|---------|---------|--------|
| pdf-parse | 1.1.1 | 18+ | None |
| node-fetch | 3.3.2 | 18+ | None |
| express | 4.19.2 | 18+ | None |
| pg | 8.11.3 | 18+ | None |

---

## 📦 Lock File Management

### For Production

Always commit `package-lock.json`:

```bash
# After installing new packages
npm install pdf-parse node-fetch
git add package.json package-lock.json
git commit -m "Add RAG dependencies: pdf-parse and node-fetch"
```

### For Development

```bash
# Clone and install
git clone <repo>
cd server
npm install  # Installs from package-lock.json
```

---

## 🐛 Troubleshooting

### Issue: "Cannot find module 'pdf-parse'"

**Solution 1: Install directly**
```bash
npm install pdf-parse
```

**Solution 2: Reinstall all dependencies**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Solution 3: Check Node.js version**
```bash
node --version  # Should be v18+
```

---

### Issue: "pdf-parse: Permission denied"

**Solution (Linux/Mac):**
```bash
npm install --unsafe-perm pdf-parse
```

---

### Issue: "ERESOLVE unable to resolve dependency tree"

**Solution:**
```bash
npm install --legacy-peer-deps pdf-parse node-fetch
```

---

### Issue: Large install size

**Normal behavior:**
- `pdf-parse`: ~15MB extracted (includes native bindings)
- `node-fetch`: ~2MB extracted
- Total: ~17MB additional disk space

**Optimize production:**
```bash
npm install --production  # Skip dev dependencies
```

---

## 🔐 Security Notes

Both dependencies are well-maintained and security-monitored:

### pdf-parse
- GitHub: https://github.com/modesty/pdf-parse
- Maintainer: Actively maintained
- Audits: Run `npm audit` to check

### node-fetch
- GitHub: https://github.com/node-fetch/node-fetch
- Maintainer: Actively maintained
- Security: Regular dependency updates

### Check for vulnerabilities
```bash
npm audit
npm audit fix  # Auto-fix if possible
```

---

## 📋 Installation Checklist

Before starting RAG system:

- [ ] Node.js v18+ installed
- [ ] `pdf-parse` installed
- [ ] `node-fetch` installed
- [ ] Verification commands pass
- [ ] Data directories created
- [ ] Environment variables set
- [ ] Setup script passes
- [ ] Server starts without errors

---

## 🎯 Next Steps

1. **Install dependencies** (if not done)
   ```bash
   npm install pdf-parse node-fetch
   ```

2. **Verify installation**
   ```bash
   npm list pdf-parse node-fetch
   ```

3. **Run setup**
   ```bash
   node setup-rag-system.js
   ```

4. **Start server**
   ```bash
   npm run dev
   ```

5. **Test RAG endpoints**
   ```bash
   node src/db/test-rag-system.js
   ```

---

## 📞 Support

For dependency issues:

1. Check `npm audit` for security issues
2. Run `npm install --save-exact` to lock versions
3. Review `package-lock.json` for conflicts
4. Check Node.js version compatibility
5. See troubleshooting section above

