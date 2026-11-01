/**
 * 可编辑控件（输入框、文本域、contenteditable）原生右键菜单的标签。
 *
 * 和 applicationMenuLabels.ts 同样是**影子 catalog**:属于用户可见文案,但不走
 * i18next,`check-i18n-glossary.mjs` 只读 renderer 的 locale JSON 扫不到它。覆盖它的
 * 是 __tests__/editableContextMenuLabels.test.ts,判定逻辑与根门禁同源。
 */
import type { SupportedLocale } from '../shared/locale.js';

export interface EditableContextMenuLabels {
  undo: string;
  redo: string;
  cut: string;
  copy: string;
  paste: string;
  pasteAsPlainText: string;
  selectAll: string;
}

export const EDITABLE_CONTEXT_MENU_LABELS: Record<SupportedLocale, EditableContextMenuLabels> = {
  en: {
    undo: 'Undo',
    redo: 'Redo',
    cut: 'Cut',
    copy: 'Copy',
    paste: 'Paste',
    pasteAsPlainText: 'Paste as Plain Text',
    selectAll: 'Select All',
  },
  fr: {
    undo: 'Annuler',
    redo: 'Rétablir',
    cut: 'Couper',
    copy: 'Copier',
    paste: 'Coller',
    pasteAsPlainText: 'Coller sans mise en forme',
    selectAll: 'Tout sélectionner',
  },
};
