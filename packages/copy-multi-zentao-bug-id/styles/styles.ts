GM_addStyle(`
.zentao-bugid-toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 10px;
}
.zentao-bugid-toolbar button {
  padding: 2px 10px;
  border-radius: 4px;
  border: 1px solid #ddd;
  background: #f5f5f5;
  cursor: pointer;
  transition: background 0.2s;
}
.zentao-bugid-toolbar button:hover {
  background: #e6f7ff;
}
.zentao-bugid-toolbar label {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  margin-left: 8px;
  font-size: 14px;
  user-select: none;
}
.zentao-bugid-checkbox {
  margin-left: 4px;
}
#zentao-copy-title-global {
  margin-right: 2px;
}
`)
