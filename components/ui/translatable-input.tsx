'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Languages, Loader2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

export interface TranslatableInputProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  targetLanguage?: string;
}

export const TranslatableInput: React.FC<TranslatableInputProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  className = '',
  disabled = false,
  required = false,
  targetLanguage = 'en'
}) => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedText, setTranslatedText] = useState<string>('');
  const [showTranslation, setShowTranslation] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleTranslate = async () => {
    if (!value || value.trim() === '') {
      toast.error('Ingresa un texto para traducir');
      return;
    }

    // Verificar si el texto es muy largo
    if (value.length > 500) {
      toast.error('El texto es muy largo. Máximo 500 caracteres.');
      return;
    }

    setIsTranslating(true);
    setShowTranslation(false); // Ocultar traducción anterior
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // Timeout de 10 segundos

      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: value.trim(),
          targetLang: targetLanguage
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Demasiadas solicitudes. Intenta de nuevo en unos momentos.');
        }
        if (response.status >= 500) {
          throw new Error('Error del servidor. Intenta de nuevo más tarde.');
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.translatedText) {
        throw new Error('No se recibió una traducción válida');
      }

      setTranslatedText(data.translatedText);
      setShowTranslation(true);
      toast.success('Texto traducido exitosamente');
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          toast.error('La traducción tardó demasiado. Intenta de nuevo.');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error('Error inesperado al traducir el texto');
      }
    } finally {
      setIsTranslating(false);
    }
  };

  const handleUseTranslation = () => {
    onChange(translatedText);
    setShowTranslation(false);
    toast.success('Traducción aplicada');
  };

  const handleCopyTranslation = async () => {
    try {
      await navigator.clipboard.writeText(translatedText);
      setCopied(true);
      toast.success('Traducción copiada al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Error al copiar al portapapeles');
    }
  };

  const maxLength = 500;
  const remainingChars = maxLength - value.length;
  const isNearLimit = remainingChars <= 50;
  const isOverLimit = remainingChars < 0;

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      
      <div className="flex gap-2">
        <div className="flex-1 space-y-1">
          <Input
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className={`${isOverLimit ? 'border-red-500 focus:border-red-500' : ''}`}
            maxLength={maxLength}
          />
          
          {value.length > 0 && (
            <div className="flex justify-between items-center text-xs">
              <span className={`${isOverLimit ? 'text-red-500' : isNearLimit ? 'text-yellow-600' : 'text-gray-500'}`}>
                {remainingChars >= 0 ? `${remainingChars} caracteres restantes` : `${Math.abs(remainingChars)} caracteres de más`}
              </span>
              {isTranslating && (
                <span className="text-blue-600">Traduciendo...</span>
              )}
            </div>
          )}
        </div>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleTranslate}
          disabled={isTranslating || disabled || !value.trim() || isOverLimit}
          className="px-3 self-start"
          title={`Traducir a ${targetLanguage === 'en' ? 'inglés' : targetLanguage}`}
        >
          {isTranslating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Languages className="h-4 w-4" />
          )}
        </Button>
      </div>

      {showTranslation && translatedText && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="text-xs text-blue-600 font-medium mb-1">
                Traducción al {targetLanguage === 'en' ? 'inglés' : targetLanguage}:
              </p>
              <p className="text-sm text-gray-800 break-words">{translatedText}</p>
            </div>
            
            <div className="flex gap-1 flex-shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyTranslation}
                className="px-2 py-1 h-auto"
                title="Copiar traducción"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
              
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleUseTranslation}
                className="px-2 py-1 h-auto text-xs"
              >
                Usar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TranslatableInput;