import apiClient from './client';

// Core integrations
export const Core = {
  InvokeLLM,
  SendEmail,
  UploadFile,
  GenerateImage,
  ExtractDataFromUploadedFile
};

// LLM integration function
export const InvokeLLM = async (prompt, model = 'gpt-3.5-turbo', options = {}) => {
  try {
    const response = await apiClient.post('integrations/llm', {
      prompt,
      model,
      ...options
    });
    return response.data;
  } catch (error) {
    console.error('Error invoking LLM:', error);
    throw error;
  }
};

// Email integration function
export const SendEmail = async (to, subject, body, from = null) => {
  try {
    const response = await apiClient.post('integrations/email', {
      to,
      subject,
      body,
      from
    });
    return response.data;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// File upload integration function
export const UploadFile = async (file, options = {}) => {
  try {
    const response = await apiClient.uploadFile('integrations/upload', file, options);
    return response.data;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

// Image generation integration function
export const GenerateImage = async (prompt, options = {}) => {
  try {
    const response = await apiClient.post('integrations/generate-image', {
      prompt,
      ...options
    });
    return response.data;
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
};

// Data extraction integration function
export const ExtractDataFromUploadedFile = async (fileUrl, extractionType = 'text') => {
  try {
    const response = await apiClient.post('integrations/extract-data', {
      file_url: fileUrl,
      extraction_type: extractionType
    });
    return response.data;
  } catch (error) {
    console.error('Error extracting data from file:', error);
    throw error;
  }
};