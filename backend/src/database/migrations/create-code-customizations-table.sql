-- Create code_customizations table for AI editor
CREATE TABLE IF NOT EXISTS code_customizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    
    -- Customization metadata
    name VARCHAR(255) NOT NULL,
    description TEXT,
    component_type VARCHAR(100), -- 'page', 'component', 'layout', etc.
    file_path VARCHAR(500), -- Original file path being customized
    
    -- Code content
    original_code TEXT, -- Original code before customization
    modified_code TEXT NOT NULL, -- Current customized code
    diff_data JSONB, -- Structured diff information
    
    -- AI metadata
    ai_prompts JSONB DEFAULT '[]'::jsonb, -- Array of AI prompts used
    ai_changes JSONB DEFAULT '[]'::jsonb, -- Array of AI-generated changes
    customization_history JSONB DEFAULT '[]'::jsonb, -- History of modifications
    
    -- Deployment info
    deployment_status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'deployed', 'failed'
    deployed_at TIMESTAMP,
    deployment_url VARCHAR(500),
    render_service_id VARCHAR(255),
    
    -- Version control
    version INTEGER DEFAULT 1,
    parent_version_id UUID REFERENCES code_customizations(id),
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    tags JSONB DEFAULT '[]'::jsonb,
    settings JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT code_customizations_name_user_unique UNIQUE(name, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_code_customizations_user_id ON code_customizations(user_id);
CREATE INDEX IF NOT EXISTS idx_code_customizations_store_id ON code_customizations(store_id);
CREATE INDEX IF NOT EXISTS idx_code_customizations_component_type ON code_customizations(component_type);
CREATE INDEX IF NOT EXISTS idx_code_customizations_deployment_status ON code_customizations(deployment_status);
CREATE INDEX IF NOT EXISTS idx_code_customizations_created_at ON code_customizations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_code_customizations_active ON code_customizations(is_active) WHERE is_active = true;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_code_customizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_code_customizations_updated_at ON code_customizations;
CREATE TRIGGER update_code_customizations_updated_at
    BEFORE UPDATE ON code_customizations
    FOR EACH ROW
    EXECUTE FUNCTION update_code_customizations_updated_at();

-- Create render_deployments table for tracking deployments
CREATE TABLE IF NOT EXISTS render_deployments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customization_id UUID NOT NULL REFERENCES code_customizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Render.com integration
    render_service_id VARCHAR(255),
    render_deploy_id VARCHAR(255),
    deploy_hook_url TEXT,
    
    -- Deployment details
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'building', 'live', 'failed'
    build_logs TEXT,
    deploy_url VARCHAR(500),
    
    -- Repository info
    repo_url VARCHAR(500),
    branch_name VARCHAR(100) DEFAULT 'main',
    commit_hash VARCHAR(40),
    
    -- Timestamps
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for render_deployments
CREATE INDEX IF NOT EXISTS idx_render_deployments_customization_id ON render_deployments(customization_id);
CREATE INDEX IF NOT EXISTS idx_render_deployments_user_id ON render_deployments(user_id);
CREATE INDEX IF NOT EXISTS idx_render_deployments_status ON render_deployments(status);
CREATE INDEX IF NOT EXISTS idx_render_deployments_started_at ON render_deployments(started_at DESC);

-- Create ai_generation_logs table for tracking AI usage
CREATE TABLE IF NOT EXISTS ai_generation_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    customization_id UUID REFERENCES code_customizations(id) ON DELETE CASCADE,
    
    -- AI request details
    prompt TEXT NOT NULL,
    element_type VARCHAR(100),
    context_data JSONB DEFAULT '{}'::jsonb,
    
    -- AI response
    generated_code TEXT,
    explanation TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    
    -- Usage tracking
    tokens_used INTEGER,
    processing_time_ms INTEGER,
    model_version VARCHAR(50),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for ai_generation_logs
CREATE INDEX IF NOT EXISTS idx_ai_generation_logs_user_id ON ai_generation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_generation_logs_customization_id ON ai_generation_logs(customization_id);
CREATE INDEX IF NOT EXISTS idx_ai_generation_logs_created_at ON ai_generation_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_generation_logs_success ON ai_generation_logs(success);

-- Insert sample data for development
INSERT INTO code_customizations (
    id,
    user_id,
    name,
    description,
    component_type,
    file_path,
    modified_code,
    ai_prompts,
    ai_changes
) VALUES (
    'sample-customization-001',
    (SELECT id FROM users WHERE role = 'store_owner' LIMIT 1),
    'Enhanced Hero Section',
    'AI-enhanced hero section with gradient backgrounds and animations',
    'component',
    'src/components/HeroSection.jsx',
    'import React from "react";

export default function HeroSection() {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-20">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl font-bold mb-4 animate-fade-in">
          Welcome to Our Store
        </h1>
        <p className="text-xl mb-8 opacity-90">
          Discover amazing products with AI-enhanced shopping experience
        </p>
        <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
          Shop Now
        </button>
      </div>
    </div>
  );
}',
    '["Make the hero section more modern with gradients", "Add animations to the title"]'::jsonb,
    '[
      {
        "type": "background_enhancement", 
        "description": "Added gradient background from blue to purple",
        "code_changes": ["bg-gradient-to-r from-blue-600 to-purple-700"]
      },
      {
        "type": "animation_addition",
        "description": "Added fade-in animation to title",
        "code_changes": ["animate-fade-in"]
      }
    ]'::jsonb
) ON CONFLICT (name, user_id) DO NOTHING;