import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  Tabs, 
  Tab, 
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Chip,
  Paper,
  Divider,
  IconButton
} from '@mui/material';
import { 
  Code as CodeIcon,
  Upload as UploadIcon,
  Psychology as AIIcon,
  Template as TemplateIcon,
  PlayArrow as PreviewIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';

const PluginBuilder = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Web Builder State
  const [pluginData, setPluginData] = useState({
    name: '',
    description: '',
    category: 'display',
    hooks: ['homepage_header'],
    code: '',
    configSchema: {}
  });
  
  // Templates State
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  // Upload State
  const [uploadFile, setUploadFile] = useState(null);
  
  // AI State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState(null);
  
  // Configuration Schema Builder
  const [configFields, setConfigFields] = useState([
    { name: 'message', type: 'string', default: 'Hello World!', description: 'Message to display' }
  ]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`/api/stores/${storeId}/plugins/create/templates`);
      const data = await response.json();
      if (data.success) {
        setTemplates(data.data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setError('');
    setSuccess('');
  };

  // Web Builder Functions
  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setPluginData({
      name: template.name,
      description: template.description,
      category: template.category,
      hooks: template.hooks,
      code: template.code,
      configSchema: template.configSchema
    });
    
    // Convert config schema to fields for editing
    const fields = Object.entries(template.configSchema).map(([name, config]) => ({
      name,
      type: config.type,
      default: config.default,
      description: config.description || ''
    }));
    setConfigFields(fields);
  };

  const handleConfigFieldChange = (index, field, value) => {
    const newFields = [...configFields];
    newFields[index][field] = value;
    setConfigFields(newFields);
    
    // Update plugin data config schema
    const schema = {};
    newFields.forEach(field => {
      schema[field.name] = {
        type: field.type,
        default: field.default,
        description: field.description
      };
    });
    setPluginData({ ...pluginData, configSchema: schema });
  };

  const addConfigField = () => {
    setConfigFields([...configFields, {
      name: `field${configFields.length + 1}`,
      type: 'string',
      default: '',
      description: ''
    }]);
  };

  const removeConfigField = (index) => {
    const newFields = configFields.filter((_, i) => i !== index);
    setConfigFields(newFields);
  };

  const createWebPlugin = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/stores/${storeId}/plugins/create/web`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pluginData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(`Plugin "${data.data.plugin.name}" created successfully!`);
        setTimeout(() => {
          navigate(`/admin/stores/${storeId}/plugins`);
        }, 2000);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to create plugin: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Upload Functions
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.name.endsWith('.zip')) {
      setUploadFile(file);
      setError('');
    } else {
      setError('Please select a valid ZIP file');
    }
  };

  const uploadPlugin = async () => {
    if (!uploadFile) {
      setError('Please select a ZIP file');
      return;
    }
    
    setLoading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('pluginZip', uploadFile);
    
    try {
      const response = await fetch(`/api/stores/${storeId}/plugins/create/upload`, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(`Plugin "${data.data.plugin.name}" uploaded successfully!`);
        setTimeout(() => {
          navigate(`/admin/stores/${storeId}/plugins`);
        }, 2000);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to upload plugin: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // AI Functions
  const generateAIPlugin = async () => {
    if (!aiPrompt.trim()) {
      setError('Please describe the plugin you want to create');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/stores/${storeId}/plugins/create/ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: aiPrompt,
          context: { storeId }
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAiResponse(data);
        setSuccess(`Plugin "${data.data.plugin.name}" generated successfully with AI!`);
        setTimeout(() => {
          navigate(`/admin/stores/${storeId}/plugins`);
        }, 3000);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to generate plugin: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index} style={{ paddingTop: '20px' }}>
      {value === index && children}
    </div>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Plugin Builder
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Create custom plugins for your store using multiple methods
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Paper sx={{ width: '100%' }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<TemplateIcon />} label="Visual Builder" />
          <Tab icon={<CodeIcon />} label="Code Editor" />
          <Tab icon={<UploadIcon />} label="Upload ZIP" />
          <Tab icon={<AIIcon />} label="AI Assistant" />
        </Tabs>

        {/* Visual Builder Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {/* Template Selection */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Choose a Template
                </Typography>
                <Grid container spacing={2}>
                  {templates.map((template) => (
                    <Grid item xs={12} md={4} key={template.id}>
                      <Card 
                        sx={{ 
                          cursor: 'pointer',
                          border: selectedTemplate?.id === template.id ? 2 : 1,
                          borderColor: selectedTemplate?.id === template.id ? 'primary.main' : 'divider'
                        }}
                        onClick={() => handleTemplateSelect(template)}
                      >
                        <CardContent>
                          <Typography variant="h6">{template.name}</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {template.description}
                          </Typography>
                          <Chip label={template.category} size="small" />
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Grid>

              {selectedTemplate && (
                <>
                  <Grid item xs={12}>
                    <Divider />
                  </Grid>

                  {/* Plugin Details */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Plugin Details</Typography>
                    <TextField
                      fullWidth
                      label="Plugin Name"
                      value={pluginData.name}
                      onChange={(e) => setPluginData({ ...pluginData, name: e.target.value })}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Description"
                      multiline
                      rows={3}
                      value={pluginData.description}
                      onChange={(e) => setPluginData({ ...pluginData, description: e.target.value })}
                      sx={{ mb: 2 }}
                    />
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={pluginData.category}
                        onChange={(e) => setPluginData({ ...pluginData, category: e.target.value })}
                      >
                        <MenuItem value="display">Display</MenuItem>
                        <MenuItem value="marketing">Marketing</MenuItem>
                        <MenuItem value="social">Social</MenuItem>
                        <MenuItem value="analytics">Analytics</MenuItem>
                        <MenuItem value="custom">Custom</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Configuration Fields */}
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">Configuration Fields</Typography>
                      <IconButton onClick={addConfigField} color="primary">
                        <AddIcon />
                      </IconButton>
                    </Box>
                    
                    {configFields.map((field, index) => (
                      <Paper key={index} sx={{ p: 2, mb: 2 }}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={3}>
                            <TextField
                              size="small"
                              label="Field Name"
                              value={field.name}
                              onChange={(e) => handleConfigFieldChange(index, 'name', e.target.value)}
                            />
                          </Grid>
                          <Grid item xs={2}>
                            <FormControl size="small" fullWidth>
                              <InputLabel>Type</InputLabel>
                              <Select
                                value={field.type}
                                onChange={(e) => handleConfigFieldChange(index, 'type', e.target.value)}
                              >
                                <MenuItem value="string">Text</MenuItem>
                                <MenuItem value="number">Number</MenuItem>
                                <MenuItem value="boolean">Yes/No</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={3}>
                            <TextField
                              size="small"
                              label="Default Value"
                              value={field.default}
                              onChange={(e) => handleConfigFieldChange(index, 'default', e.target.value)}
                            />
                          </Grid>
                          <Grid item xs={3}>
                            <TextField
                              size="small"
                              label="Description"
                              value={field.description}
                              onChange={(e) => handleConfigFieldChange(index, 'description', e.target.value)}
                            />
                          </Grid>
                          <Grid item xs={1}>
                            <IconButton 
                              onClick={() => removeConfigField(index)}
                              color="error"
                              size="small"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Grid>
                        </Grid>
                      </Paper>
                    ))}
                  </Grid>

                  {/* Plugin Code Preview */}
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>Generated Code</Typography>
                    <SyntaxHighlighter 
                      language="javascript" 
                      style={tomorrow}
                      customStyle={{ maxHeight: '300px' }}
                    >
                      {pluginData.code}
                    </SyntaxHighlighter>
                  </Grid>

                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={createWebPlugin}
                      disabled={loading || !pluginData.name || !pluginData.code}
                      startIcon={<SaveIcon />}
                    >
                      {loading ? 'Creating Plugin...' : 'Create Plugin'}
                    </Button>
                  </Grid>
                </>
              )}
            </Grid>
          </Box>
        </TabPanel>

        {/* Code Editor Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Plugin Name"
                  value={pluginData.name}
                  onChange={(e) => setPluginData({ ...pluginData, name: e.target.value })}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={pluginData.description}
                  onChange={(e) => setPluginData({ ...pluginData, description: e.target.value })}
                  sx={{ mb: 2 }}
                />
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={pluginData.category}
                    onChange={(e) => setPluginData({ ...pluginData, category: e.target.value })}
                  >
                    <MenuItem value="display">Display</MenuItem>
                    <MenuItem value="marketing">Marketing</MenuItem>
                    <MenuItem value="social">Social</MenuItem>
                    <MenuItem value="analytics">Analytics</MenuItem>
                    <MenuItem value="custom">Custom</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Plugin Code</Typography>
                <CodeMirror
                  value={pluginData.code}
                  height="400px"
                  extensions={[javascript()]}
                  theme={oneDark}
                  onChange={(value) => setPluginData({ ...pluginData, code: value })}
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={createWebPlugin}
                  disabled={loading || !pluginData.name || !pluginData.code}
                  startIcon={<SaveIcon />}
                >
                  {loading ? 'Creating Plugin...' : 'Create Plugin'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Upload Tab */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <input
              accept=".zip"
              style={{ display: 'none' }}
              id="plugin-upload"
              type="file"
              onChange={handleFileUpload}
            />
            <label htmlFor="plugin-upload">
              <Card sx={{ p: 4, border: '2px dashed', borderColor: 'primary.main', cursor: 'pointer' }}>
                <UploadIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Drop your plugin ZIP file here or click to browse
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Maximum file size: 10MB
                </Typography>
              </Card>
            </label>

            {uploadFile && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="body1">
                  Selected: {uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  onClick={uploadPlugin}
                  disabled={loading}
                  startIcon={<UploadIcon />}
                  sx={{ mt: 2 }}
                >
                  {loading ? 'Uploading...' : 'Upload & Install Plugin'}
                </Button>
              </Box>
            )}

            <Box sx={{ mt: 4, textAlign: 'left' }}>
              <Typography variant="h6" gutterBottom>
                Plugin ZIP Structure
              </Typography>
              <SyntaxHighlighter language="bash" style={tomorrow}>
{`my-plugin/
├── manifest.json    # Plugin configuration
├── index.js         # Main plugin code
├── styles.css       # CSS styles (optional)
└── README.md        # Documentation (optional)`}
              </SyntaxHighlighter>
            </Box>
          </Box>
        </TabPanel>

        {/* AI Assistant Tab */}
        <TabPanel value={activeTab} index={3}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Describe Your Plugin
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Tell our AI what kind of plugin you want to create. Be as specific as possible!
            </Typography>

            <TextField
              fullWidth
              multiline
              rows={6}
              label="Plugin Description"
              placeholder="I want a plugin that shows a welcome message with my store name on the homepage. It should have a nice gradient background and be customizable..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              sx={{ mb: 3 }}
            />

            <Button
              variant="contained"
              size="large"
              onClick={generateAIPlugin}
              disabled={loading || !aiPrompt.trim()}
              startIcon={<AIIcon />}
            >
              {loading ? 'Generating Plugin...' : 'Generate Plugin with AI'}
            </Button>

            {aiResponse && (
              <Box sx={{ mt: 4 }}>
                <Alert severity="success">
                  <Typography variant="h6">Plugin Generated Successfully!</Typography>
                  <Typography variant="body2">
                    {aiResponse.data.aiResponse}
                  </Typography>
                </Alert>
              </Box>
            )}

            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Example Prompts
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Chip 
                  label="Create a rotating welcome message that changes every 3 seconds"
                  variant="outlined"
                  clickable
                  onClick={() => setAiPrompt("Create a rotating welcome message that changes every 3 seconds")}
                />
                <Chip 
                  label="Show a promotional banner with custom colors and call-to-action button"
                  variant="outlined"
                  clickable
                  onClick={() => setAiPrompt("Show a promotional banner with custom colors and call-to-action button")}
                />
                <Chip 
                  label="Display social media links with icons in the footer"
                  variant="outlined"
                  clickable
                  onClick={() => setAiPrompt("Display social media links with icons in the footer")}
                />
              </Box>
            </Box>
          </Box>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default PluginBuilder;