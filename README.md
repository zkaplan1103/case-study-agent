# PartSelect AI Chat Agent

An intelligent chat agent for PartSelect e-commerce website, focusing on Refrigerator and Dishwasher parts. Built with modern ALM (Augmented Language Model) architecture using DeepSeek integration.

## 🚀 Project Structure

```
partselect-chat/
├── partselect-chat-backend/          # Node.js + TypeScript backend
│   ├── src/
│   │   ├── agents/                   # ReAct agent architecture
│   │   ├── tools/                    # Self-supervised tool learning
│   │   ├── retrieval/                # Hybrid dense+sparse retrieval
│   │   ├── services/                 # Business logic services
│   │   ├── routes/                   # Fastify API routes
│   │   └── types/                    # TypeScript schemas
│   ├── drizzle/                      # Database schema & migrations
│   └── data/                         # Product data & processing
├── src/                              # React frontend
├── public/                           # Static assets
└── docs/                            # Documentation
```

## 🛠️ Technology Stack

### Backend
- **Framework**: Fastify (high-performance Node.js)
- **Database**: SQLite with Drizzle ORM
- **AI/ML**: DeepSeek API integration (required)
- **Real-time**: Socket.io
- **Validation**: Zod schemas

### Frontend  
- **Framework**: React 18
- **Styling**: Tailwind CSS with PartSelect branding
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **Real-time**: Socket.io Client

## 🎯 Core Features

1. **Product Discovery** - Natural language search for appliance parts
2. **Compatibility Verification** - Clear yes/no answers for part/model combinations  
3. **Installation Guidance** - Step-by-step instructions with tool requirements
4. **Troubleshooting Support** - Symptom-based diagnosis and part recommendations
5. **Order & Customer Support** - Order status, returns, warranty information
6. **Expert Recommendations** - Professional installation guidance

## 📋 Required Test Cases

- ✅ "How can I install part number PS11752778?"
- ✅ "Is this part compatible with my WDT780SAEM1 model?"
- ✅ "The ice maker on my Whirlpool fridge is not working. How can I fix it?"

---

*This project was bootstrapped with Create React App and enhanced with modern ALM architecture.*

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
