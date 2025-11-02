# Azure OpenAI Setup

## Quick Setup (2 steps)

1. **Get your API key** from Azure Portal:
   - Go to: https://portal.azure.com
   - Navigate to: Your Resource (cimb-u23-2038-resource) → Keys and Endpoint
   - Copy one of the keys (Key 1 or Key 2)

2. **Create `.env.local` file** in the project root with:
   ```env
   AZURE_OPENAI_ENDPOINT=https://cimb-u23-2038-resource.cognitiveservices.azure.com/
   AZURE_OPENAI_API_KEY=your-api-key-here
   AZURE_OPENAI_DEPLOYMENT=gpt-4.1
   ```

3. **Restart your dev server**:
   ```bash
   npm run dev
   ```

That's it! The AI will now work when you click on nodes in the graph.

## Where to find your API key

1. Go to Azure Portal: https://portal.azure.com
2. Navigate to: **Azure AI Foundry** → **cimb-u23-2038**
3. Click on **Deployments** → **gpt-4.1**
4. Click **Show Keys** or go to **Keys and Endpoint** section
5. Copy **Key 1** or **Key 2**

## Testing

After setup, click any node in the graph. You should see detailed AI-generated fraud analysis reports instead of basic detection messages.

