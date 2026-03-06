from googletrans import Translator

translator = Translator()

def translate_to_tamil(text):
    try:
        if not text or len(text.strip()) == 0:
            return text
        result = translator.translate(text, dest='ta', src='en')
        return result.text
    except:
        return text

def translate_dict(data):
    if isinstance(data, dict):
        translated = {}
        for k, v in data.items():
            if k in ['disease_name', 'description']:
                translated[k] = translate_to_tamil(v) if isinstance(v, str) else v
            elif k == 'remedies' and isinstance(v, list):
                translated[k] = [translate_to_tamil(r) for r in v]
            else:
                translated[k] = v
        return translated
    return data
