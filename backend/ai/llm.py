"""Minimal OpenRouter client (OpenAI-compatible chat completions API)."""
import json

import requests
from django.conf import settings

class LLMError(Exception):
    """Any failure talking to the model: missing config, network, bad output."""


def complete(messages, tools=None, schema=None, max_tokens=800):
    """Returns the assistant message dict ({'content': ..., 'tool_calls': [...]})."""
    if not (settings.OPENROUTER_API_KEY and settings.OPENROUTER_MODEL):
        raise LLMError('AI is not configured (set OPENROUTER_API_KEY and OPENROUTER_MODEL).')
    body = {'model': settings.OPENROUTER_MODEL, 'messages': messages, 'max_tokens': max_tokens}
    if tools:
        body['tools'] = tools
    if schema:
        body['response_format'] = {'type': 'json_schema', 'json_schema': {'name': 'result', 'strict': True, 'schema': schema}}
    try:
        r = requests.post(settings.OPENROUTER_URL, json=body, timeout=settings.OPENROUTER_TIMEOUT, headers={
            'Authorization': f'Bearer {settings.OPENROUTER_API_KEY}', 'X-Title': 'Economic Communication Center'})
    except requests.RequestException as e:
        raise LLMError(f'Cannot reach the AI service: {e}') from e
    if not r.ok:  # OpenRouter explains errors in {"error": {"message": ...}} (429 = rate limit, 402 = no credits)
        try:
            detail = r.json()['error']['message']
        except (ValueError, KeyError, TypeError):
            detail = r.text[:200]
        raise LLMError(f'AI service error {r.status_code}: {detail}')
    try:
        return r.json()['choices'][0]['message']
    except (ValueError, KeyError, IndexError, TypeError) as e:
        raise LLMError('AI returned an unexpected response.') from e


def content_of(message):
    """Message text; some providers return a list of content parts instead of a string."""
    c = message.get('content') or ''
    return ''.join(p.get('text', '') for p in c if isinstance(p, dict)) if isinstance(c, list) else str(c)


def text(messages, **kw):
    return content_of(complete(messages, **kw)).strip()


def structured(messages, schema, **kw):
    """JSON output validated by schema; tolerates models that wrap JSON in prose or code fences."""
    out = text(messages, schema=schema, **kw)
    try:
        return json.loads(out[out.index('{'):out.rindex('}') + 1])
    except ValueError as e:
        raise LLMError('AI returned invalid JSON.') from e


# JSON Schema helpers (strict mode: every property required, no extras)
S, I = {'type': 'string'}, {'type': 'integer'}


def obj(**props):
    return {'type': 'object', 'properties': props, 'required': list(props), 'additionalProperties': False}


def arr(items):
    return {'type': 'array', 'items': items}
