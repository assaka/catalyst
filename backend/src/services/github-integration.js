const axios = require('axios');
const crypto = require('crypto');

class GitHubIntegration {
  constructor() {
    this.baseUrl = 'https://api.github.com';
    this.clientId = process.env.GITHUB_CLIENT_ID;
    this.clientSecret = process.env.GITHUB_CLIENT_SECRET;
    this.templateRepo = 'daino-ecommerce/store-template';
  }

  /**
   * Get GitHub OAuth authorization URL
   */
  getAuthorizationUrl(storeId, state = null) {
    const actualState = state || crypto.randomBytes(16).toString('hex');
    const scope = 'repo,user:email';
    
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: `${process.env.BACKEND_URL}/api/github/callback`,
      scope: scope,
      state: `${storeId}:${actualState}`,
      allow_signup: 'true'
    });

    return {
      url: `https://github.com/login/oauth/authorize?${params}`,
      state: actualState
    };
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code, state) {
    try {
      const response = await axios.post('https://github.com/login/oauth/access_token', {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: code
      }, {
        headers: {
          'Accept': 'application/json'
        }
      });

      const { access_token, token_type, scope } = response.data;

      if (!access_token) {
        throw new Error('No access token received from GitHub');
      }

      return {
        success: true,
        access_token,
        token_type,
        scope
      };
    } catch (error) {
      console.error('GitHub token exchange failed:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  /**
   * Get user information from GitHub
   */
  async getUserInfo(accessToken) {
    try {
      const response = await axios.get(`${this.baseUrl}/user`, {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      return {
        success: true,
        user: {
          id: response.data.id,
          login: response.data.login,
          name: response.data.name,
          email: response.data.email,
          avatar_url: response.data.avatar_url,
          public_repos: response.data.public_repos,
          private_repos: response.data.total_private_repos
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Create a new repository from template
   */
  async createRepositoryFromTemplate(accessToken, repoName, description, isPrivate = true) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/repos/${this.templateRepo}/generate`,
        {
          name: repoName,
          description: description || `Store repository for ${repoName}`,
          private: isPrivate,
          include_all_branches: false
        },
        {
          headers: {
            'Authorization': `token ${accessToken}`,
            'Accept': 'application/vnd.github.baptiste-preview+json'
          }
        }
      );

      return {
        success: true,
        repository: {
          id: response.data.id,
          name: response.data.name,
          full_name: response.data.full_name,
          html_url: response.data.html_url,
          clone_url: response.data.clone_url,
          ssh_url: response.data.ssh_url,
          private: response.data.private,
          created_at: response.data.created_at
        }
      };
    } catch (error) {
      console.error('GitHub repository creation failed:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Commit template changes to repository
   */
  async commitTemplateChanges(accessToken, repoFullName, templates, commitMessage) {
    try {
      // Get current repository tree
      const { data: repo } = await axios.get(`${this.baseUrl}/repos/${repoFullName}`, {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      const { data: currentCommit } = await axios.get(
        `${this.baseUrl}/repos/${repoFullName}/git/commits/${repo.default_branch}`,
        {
          headers: {
            'Authorization': `token ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      // Create blobs for template files
      const blobs = [];
      for (const template of templates) {
        const content = JSON.stringify({
          type: template.type,
          name: template.name,
          elements: template.elements,
          styles: template.styles,
          settings: template.settings,
          version: template.version
        }, null, 2);

        const { data: blob } = await axios.post(
          `${this.baseUrl}/repos/${repoFullName}/git/blobs`,
          {
            content: Buffer.from(content).toString('base64'),
            encoding: 'base64'
          },
          {
            headers: {
              'Authorization': `token ${accessToken}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          }
        );

        blobs.push({
          path: `templates/${template.type}.json`,
          mode: '100644',
          type: 'blob',
          sha: blob.sha
        });
      }

      // Create tree with new blobs
      const { data: newTree } = await axios.post(
        `${this.baseUrl}/repos/${repoFullName}/git/trees`,
        {
          base_tree: currentCommit.tree.sha,
          tree: blobs
        },
        {
          headers: {
            'Authorization': `token ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      // Create commit
      const { data: newCommit } = await axios.post(
        `${this.baseUrl}/repos/${repoFullName}/git/commits`,
        {
          message: commitMessage || 'Update store templates',
          tree: newTree.sha,
          parents: [currentCommit.sha]
        },
        {
          headers: {
            'Authorization': `token ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      // Update branch reference
      await axios.patch(
        `${this.baseUrl}/repos/${repoFullName}/git/refs/heads/${repo.default_branch}`,
        {
          sha: newCommit.sha
        },
        {
          headers: {
            'Authorization': `token ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      return {
        success: true,
        commit: {
          sha: newCommit.sha,
          message: newCommit.message,
          html_url: `https://github.com/${repoFullName}/commit/${newCommit.sha}`
        }
      };
    } catch (error) {
      console.error('GitHub commit failed:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Set up webhook for repository changes
   */
  async setupWebhook(accessToken, repoFullName, webhookUrl) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/repos/${repoFullName}/hooks`,
        {
          name: 'web',
          active: true,
          events: ['push', 'pull_request'],
          config: {
            url: webhookUrl,
            content_type: 'json',
            secret: process.env.GITHUB_WEBHOOK_SECRET || crypto.randomBytes(16).toString('hex')
          }
        },
        {
          headers: {
            'Authorization': `token ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      return {
        success: true,
        webhook: {
          id: response.data.id,
          url: response.data.config.url,
          events: response.data.events,
          active: response.data.active
        }
      };
    } catch (error) {
      console.error('GitHub webhook setup failed:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Get repository information
   */
  async getRepositoryInfo(accessToken, repoFullName) {
    try {
      const response = await axios.get(`${this.baseUrl}/repos/${repoFullName}`, {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      return {
        success: true,
        repository: {
          id: response.data.id,
          name: response.data.name,
          full_name: response.data.full_name,
          html_url: response.data.html_url,
          clone_url: response.data.clone_url,
          ssh_url: response.data.ssh_url,
          private: response.data.private,
          default_branch: response.data.default_branch,
          pushed_at: response.data.pushed_at,
          size: response.data.size
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * List user repositories
   */
  async getUserRepositories(accessToken, page = 1, perPage = 30) {
    try {
      const response = await axios.get(`${this.baseUrl}/user/repos`, {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        },
        params: {
          page: page,
          per_page: perPage,
          sort: 'updated',
          direction: 'desc'
        }
      });

      return {
        success: true,
        repositories: response.data.map(repo => ({
          id: repo.id,
          name: repo.name,
          full_name: repo.full_name,
          html_url: repo.html_url,
          private: repo.private,
          default_branch: repo.default_branch,
          updated_at: repo.updated_at
        }))
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Store GitHub credentials for a store
   */
  async storeCredentials(storeId, tokenData, userInfo) {
    try {
      const GitHubOAuthToken = require('../models/GitHubOAuthToken');
      
      await GitHubOAuthToken.createOrUpdate(storeId, {
        access_token: tokenData.access_token,
        token_type: tokenData.token_type,
        scope: tokenData.scope,
        user_id: userInfo.id,
        user_login: userInfo.login,
        user_name: userInfo.name,
        user_email: userInfo.email,
        avatar_url: userInfo.avatar_url
      });

      return {
        success: true,
        message: 'GitHub credentials stored successfully'
      };
    } catch (error) {
      console.error('Failed to store GitHub credentials:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get stored GitHub credentials for a store
   */
  async getStoredCredentials(storeId) {
    try {
      const GitHubOAuthToken = require('../models/GitHubOAuthToken');
      const token = await GitHubOAuthToken.findByStore(storeId);
      return token ? token.toJSON() : null;
    } catch (error) {
      console.error('Failed to get GitHub credentials:', error);
      return null;
    }
  }

  /**
   * Test connection with stored credentials
   */
  async testConnection(storeId) {
    try {
      const credentials = await this.getStoredCredentials(storeId);
      
      if (!credentials) {
        return {
          success: false,
          connected: false,
          message: 'No GitHub credentials found'
        };
      }

      const userInfo = await this.getUserInfo(credentials.access_token);
      
      if (!userInfo.success) {
        return {
          success: false,
          connected: false,
          message: 'GitHub token invalid or expired'
        };
      }

      return {
        success: true,
        connected: true,
        user: userInfo.user,
        message: 'Connected to GitHub successfully'
      };

    } catch (error) {
      console.error('GitHub connection test failed:', error);
      return {
        success: false,
        connected: false,
        message: error.message
      };
    }
  }
}

module.exports = new GitHubIntegration();