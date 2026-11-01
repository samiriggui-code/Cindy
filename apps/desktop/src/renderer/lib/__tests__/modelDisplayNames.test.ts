import { beforeAll, describe, expect, it } from 'vitest';
import { createInstance } from 'i18next';
import en from '../../i18n/locales/en/common.json';
import fr from '@/i18n/locales/fr/common.json';
import { localizedModelName, localizedBrandName, matchesModelName, modelBrand } from '../modelDisplayNames';

const i18n = createInstance();
beforeAll(async () => {
  await i18n.init({ lng: 'fr', fallbackLng: 'en', resources: {
    en: { translation: en }, fr: { translation: fr },
  } });
});

describe('localized model display names', () => {
  it('leaves English, unknown models and custom labels intact', () => {
    for (const name of ['Hy4 preview', 'Hunyuan 4', 'Qwen3.8 Max', 'Doubao Seed 2.1 Pro']) {
      for (const locale of ['en', 'fr']) expect(localizedModelName(name, i18n.getFixedT(locale))).toBe(name);
    }
    for (const name of ['GPT-6 Astra', 'Claude Opus 5', 'Gemini 3.8 Flash', 'Kimi K3', 'GLM 5.3 Flash', '我的模型', 'Hybrid Agent']) {
      expect(localizedModelName(name, i18n.getFixedT('fr'))).toBe(name);
    }
  });
  it('separates the manufacturer from the model name and preserves unknown namespaces', () => {
    const t = i18n.getFixedT('fr');
    expect(localizedBrandName(modelBrand({ id: 'z-ai/glm-5.3-flash' })!, t)).toBe('Z.ai');
    expect(localizedBrandName(modelBrand({ id: 'qwen/qwen3.8-max' })!, t)).toBe('Alibaba');
    expect(localizedBrandName(modelBrand({ id: 'new-maker/new-model' })!, t)).toBe('new-maker');
  });
  it('shows a model-group Auto by its server name, grouped like the preset Auto rather than under an "auto" vendor', () => {
    expect(modelBrand({ id: 'auto/grp_123' })).toBeUndefined();
    expect(modelBrand({ id: 'auto' })).toBeUndefined();
    const t = i18n.getFixedT('fr');
    expect(localizedModelName('Auto (研发组)', t)).toBe('Auto (研发组)');
    expect(matchesModelName({ id: 'auto/grp_123', name: 'Auto (研发组)' }, '研发组', t)).toBe(true);
    // A real vendor namespace that merely starts with "auto" is still a vendor.
    expect(modelBrand({ id: 'autoglm/model' })).toMatchObject({ label: 'autoglm' });
  });
  it('searches both languages (fr, en), manufacturer and exact model ID without modifying model data', () => {
    const model = Object.freeze({ id: 'qwen/qwen3.8-max', name: 'Qwen3.8 Max' });
    for (const locale of ['fr', 'en']) {
      const t = i18n.getFixedT(locale);
      for (const q of ['qwen', 'Alibaba', model.id, 'qwen max', 'qwen3.8']) {
        expect(matchesModelName(model, q, t), `${locale}: ${q}`).toBe(true);
      }
      expect(matchesModelName(model, 'GPT', t)).toBe(false);
    }
    expect(model).toEqual({ id: 'qwen/qwen3.8-max', name: 'Qwen3.8 Max' });
  });
});
