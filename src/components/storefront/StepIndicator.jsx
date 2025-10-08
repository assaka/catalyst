import React from 'react';
import { Check } from 'lucide-react';

export default function StepIndicator({ steps, currentStep, style, activeColor, inactiveColor, completedColor }) {
  const renderCircleStyle = (index) => {
    const step = steps[index];
    const isCompleted = currentStep > index;
    const isActive = currentStep === index;

    let backgroundColor = inactiveColor;
    if (isCompleted) backgroundColor = completedColor;
    else if (isActive) backgroundColor = activeColor;

    return {
      backgroundColor,
      borderColor: backgroundColor,
      color: '#FFFFFF',
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: '600',
      border: '2px solid',
      transition: 'all 0.3s ease'
    };
  };

  const renderConnectorStyle = (index) => {
    const isCompleted = currentStep > index;

    return {
      flex: 1,
      height: '2px',
      backgroundColor: isCompleted ? completedColor : inactiveColor,
      margin: '0 8px',
      transition: 'all 0.3s ease'
    };
  };

  if (style === 'circles') {
    return (
      <div className="flex items-center justify-between w-full max-w-2xl mx-auto mb-8">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <div className="flex flex-col items-center">
              <div style={renderCircleStyle(index)}>
                {currentStep > index ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span className="text-sm mt-2 text-gray-600 hidden sm:block">{step}</span>
            </div>
            {index < steps.length - 1 && (
              <div style={renderConnectorStyle(index)} />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  }

  if (style === 'bars') {
    return (
      <div className="w-full max-w-2xl mx-auto mb-8">
        <div className="flex gap-2">
          {steps.map((step, index) => {
            const isCompleted = currentStep > index;
            const isActive = currentStep === index;

            let barColor = inactiveColor;
            if (isCompleted) barColor = completedColor;
            else if (isActive) barColor = activeColor;

            return (
              <div key={index} className="flex-1">
                <div
                  style={{
                    backgroundColor: barColor,
                    height: '8px',
                    borderRadius: '4px',
                    transition: 'all 0.3s ease'
                  }}
                />
                <p className="text-xs mt-2 text-gray-600 hidden sm:block">{step}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (style === 'numbers') {
    return (
      <div className="w-full max-w-2xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = currentStep > index;
            const isActive = currentStep === index;

            let textColor = inactiveColor;
            if (isCompleted) textColor = completedColor;
            else if (isActive) textColor = activeColor;

            return (
              <div key={index} className="flex items-center">
                <div className="flex items-center">
                  <span
                    style={{
                      color: textColor,
                      fontWeight: isActive ? '700' : '400',
                      fontSize: '1.125rem',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {index + 1}. {step}
                  </span>
                  {isCompleted && (
                    <Check className="w-4 h-4 ml-2" style={{ color: completedColor }} />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <span className="mx-4 text-gray-400">→</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
