<script setup lang="ts">
import { TabsProps, TdSelectProps } from 'tdesign-vue-next'

const visible = ref(false)
const value = ref(0)
const { data: activePanel, save: saveActivePanel } = useMonkeyStorage<string | number>({
  key: 'codesign-css-to-tailwind-active-panel',
  defaultValue: '',
})
const { data: data, save: savePanelList } = useMonkeyStorage<{ label: string; value: number; code: string }[]>({
  key: 'codesign-css-to-tailwind-panels',
  defaultValue: [
    {
      label: '示例',
      value: 0,
      code: `:root {
  --td-brand-color: #154199;
  --td-brand-color-1: #f2f3ff;
  --td-brand-color-2: #d8e1ff;
  --td-brand-color-3: #b5c8ff;
  --td-brand-color-4: #8babff;
  --td-brand-color-5: #6d8feb;
  --td-brand-color-6: #5174ce;
  --td-brand-color-7: #3459b2;
  --td-brand-color-8: #154199;
  --td-brand-color-9: #002b79;
  --td-brand-color-10: #001b54;
  --td-brand-color-11: #6e8aff;
  --td-brand-color-12: #f8f9fc;
}`,
    },
  ],
})
const panelList = ref<{ label: string; value: number; code: string }[]>(data.value)
const openDialog = () => {
  panelList.value = data.value
  visible.value = true
}

const confirmDialog = () => {
  savePanelList(panelList.value)
  visible.value = false
}

const closeDialog = () => {
  visible.value = false
}

const handleActivePanelChange: TdSelectProps['onChange'] = (value) => {
  console.log('value', value)
  saveActivePanel(value as string)
}

const addPanel: TabsProps['onAdd'] = () => {
  const newPanelList = [
    ...panelList.value,
    {
      label: '配置' + panelList.value.length,
      value: panelList.value.length,
      code: '',
    },
  ]
  panelList.value = newPanelList
  value.value = panelList.value.length - 1
}

const removePanel: TabsProps['onRemove'] = (options) => {
  const index = panelList.value.findIndex((item) => item.value === options.value)
  const newPanelList = panelList.value.filter((item) => item.value !== options.value)
  panelList.value = newPanelList

  if (options.value === value.value) {
    value.value = index > 0 ? panelList.value[index - 1]?.value || 0 : 0
  }
}
</script>

<template>
  <div>
    <div class="flex items-center !mb-2">
      <t-select @change="handleActivePanelChange" class="select" v-model="activePanel" :options="data" />
      <button
        @click="openDialog"
        type="button"
        class="!ml-2 unit-setting__trigger t-button t-size-m t-button--variant-text t-button--theme-default t-button--shape-square"
      >
        <span class="t-button__text"><i data-v-2f06d9a5="" class="com-icon iconfont-v2 icon-v2-setting"></i></span>
      </button>
    </div>
    <t-dialog
      @close="closeDialog"
      @confirm="confirmDialog"
      width="750px"
      :header="'配置颜色变量'"
      v-model:visible="visible"
    >
      <t-tabs theme="card" size="medium" :addable="true" v-model="value" @add="addPanel" @remove="removePanel">
        <t-tab-panel
          :removable="panelList.length > 1"
          v-for="item in panelList"
          :value="item.value"
          :label="item.label"
        >
          <template #label>
            <t-input :readonly="item.value === 0" v-model="item.label" />
          </template>
          <t-textarea :autosize="{ minRows: 10, maxRows: 19 }" v-model="item.code" language="css" theme="vs-dark" />
        </t-tab-panel>
      </t-tabs>
    </t-dialog>
  </div>
</template>
<style>
.tailwind-setting__trigger {
  color: var(--td-brand-color-10);
  font-size: 20px;
}
.select {
  input {
    user-select: none;
  }
}
</style>
