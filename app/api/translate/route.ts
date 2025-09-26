import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text, targetLang = 'en' } = await request.json();

    if (!text || text.trim() === '') {
      return NextResponse.json(
        { error: 'Texto requerido para traducir' },
        { status: 400 }
      );
    }

    // Usar la API gratuita de MyMemory Translation
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=es|${targetLang}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Error en el servicio de traducción');
    }

    const data = await response.json();

    if (data.responseStatus !== 200) {
      throw new Error('Error en la respuesta del servicio de traducción');
    }

    const translatedText = data.responseData.translatedText;

    return NextResponse.json({
      originalText: text,
      translatedText: translatedText,
      targetLanguage: targetLang,
      success: true
    });

  } catch (error) {
    console.error('Error en traducción:', error);
    return NextResponse.json(
      { 
        error: 'Error al traducir el texto',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}