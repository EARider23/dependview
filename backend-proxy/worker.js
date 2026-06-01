/**
 * Cloudflare Worker for Jira Feedback Integration
 * 
 * Environment Variables Required:
 * - JIRA_EMAIL: Your Atlassian account email
 * - JIRA_API_TOKEN: Your Jira API Token (generate at https://id.atlassian.com/manage-profile/security/api-tokens)
 * - JIRA_DOMAIN: e.g., "yourcompany.atlassian.net"
 * - JIRA_PROJECT_KEY: e.g., "DEP" (The prefix for your issues)
 * - ALLOWED_ORIGIN: e.g., "http://localhost:5173" or "*" for testing
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Update this in production
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export default {
  async fetch(request, env, ctx) {
    // Handle CORS Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    const url = new URL(request.url)
    
    // Auth headers for Jira
    const authHeader = `Basic ${btoa(`${env.JIRA_EMAIL}:${env.JIRA_API_TOKEN}`)}`
    const jiraBaseUrl = `https://${env.JIRA_DOMAIN}/rest/api/3`

    try {
      // Route: POST /api/feedback (Create Issue)
      if (request.method === 'POST' && url.pathname === '/api/feedback') {
        const body = await request.json()
        const { type, title, description, deviceId } = body

        const issueType = type === 'bug' ? 'Bug' : 'Task' // Map to your Jira issue types

        const jiraPayload = {
          fields: {
            project: { key: env.JIRA_PROJECT_KEY },
            summary: `[${type.toUpperCase()}] ${title}`,
            description: {
              type: "doc",
              version: 1,
              content: [
                {
                  type: "paragraph",
                  content: [
                    { type: "text", text: description },
                    { type: "text", text: `\n\nDevice ID: ${deviceId}` }
                  ]
                }
              ]
            },
            issuetype: { name: issueType }
          }
        }

        const response = await fetch(`${jiraBaseUrl}/issue`, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(jiraPayload)
        })

        if (!response.ok) {
          const errText = await response.text()
          throw new Error(`Jira API error: ${response.status} - ${errText}`)
        }

        const data = await response.json()
        
        return new Response(JSON.stringify({
          success: true,
          issueKey: data.key,
          issueId: data.id
        }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      // Route: GET /api/feedback/status?ids=DEP-1,DEP-2
      if (request.method === 'GET' && url.pathname === '/api/feedback/status') {
        const idsParam = url.searchParams.get('ids')
        if (!idsParam) return new Response('Missing ids parameter', { status: 400, headers: corsHeaders })
        
        const ids = idsParam.split(',').map(id => id.trim()).filter(Boolean)
        
        // JQL to fetch specific issues
        const jql = `issueKey in (${ids.join(',')})`
        
        const response = await fetch(`${jiraBaseUrl}/search/jql?jql=${encodeURIComponent(jql)}&fields=status`, {
          headers: {
            'Authorization': authHeader,
            'Accept': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`Jira API error: ${response.status}`)
        }

        const data = await response.json()
        
        // Map Jira response to simpler format for frontend
        const statuses = data.issues.map(issue => ({
          id: issue.key,
          status: issue.fields.status.name.toLowerCase() === 'done' || issue.fields.status.name.toLowerCase() === 'resolved' ? 'resolved' : 'open'
        }))

        return new Response(JSON.stringify(statuses), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response('Not Found', { status: 404, headers: corsHeaders })
      
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }
  }
}
