<template>
  <v-card>
    <v-toolbar density="compact" elevation="0">
      <v-toolbar-title>{{ title }}</v-toolbar-title>
      <v-spacer />
      <v-menu v-model="menu" location="bottom">
        <template #activator="{ props }">
          <v-btn size="small" v-bind="props" prepend-icon="mdi-calendar">
            {{ $gettext('Period') }}
            <span v-if="period">: {{ period }}</span>
          </v-btn>
        </template>
        <v-container class="bg-surface pa-4" fluid>
          <v-row no-gutters>
            <v-col cols="12" md="6" class="pr-2">
              <div class="text-subtitle-1">
                {{ $gettext('Absolute time range') }}
              </div>
              <DateField v-model="start" :label="$gettext('From')" />
              <DateField v-model="end" :label="$gettext('To')" />
              <v-btn color="primary" @click="setCustomPeriod">{{
                $gettext('Apply')
              }}</v-btn>
            </v-col>
            <v-col cols="12" md="6">
              <div class="text-subtitle-1">
                {{ $gettext('Relative time ranges') }}
              </div>
              <v-list>
                <v-list-item
                  v-for="_period in periods"
                  :key="_period.value"
                  @click="setPeriod(_period.value)"
                >
                  <v-list-item-title>
                    {{ _period.name }}
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-col>
          </v-row>
        </v-container>
      </v-menu>
    </v-toolbar>
    <v-card-text>
      <apexchart
        v-if="statistics"
        type="area"
        height="350"
        :options="options"
        :series="statistics.series"
      />
    </v-card-text>
  </v-card>
</template>

<script setup lang="js">
import statisticsApi from '@/api/statistics'
import DateField from './DateField.vue'
import { ref, computed, onMounted, watch } from 'vue'
import { useGettext } from 'vue3-gettext'

const { $gettext } = useGettext()

const _props = defineProps({
  domain: {
    type: Object,
    required: false,
    default: null,
  },
  graphicSet: { type: String, default: null },
  graphicName: { type: String, default: null },
})

const title = computed(() => {
  if (statistics.value) {
    return statistics.value.title
  }
  return ''
})

const menu = ref(false)
// Editorial dark chart: transparent canvas (the card shows through), mono
// axis labels, hairline grid and a dark tooltip — matching the design tokens.
const MONO = "'JetBrains Mono', ui-monospace, monospace"
const options = ref({
  chart: {
    type: 'area',
    stacked: false,
    background: 'transparent',
    foreColor: '#a3a3a3',
    fontFamily: MONO,
    zoom: {
      type: 'x',
      enabled: true,
      autoScaleYaxis: true,
    },
    toolbar: {
      autoSelected: 'zoom',
    },
  },
  theme: {
    mode: 'dark',
  },
  dataLabels: {
    enabled: false,
  },
  stroke: {
    width: 2,
    curve: 'smooth',
  },
  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.35,
      opacityTo: 0.05,
      stops: [0, 90, 100],
    },
  },
  grid: {
    borderColor: '#2e2e2e',
    strokeDashArray: 0,
  },
  tooltip: {
    theme: 'dark',
  },
  legend: {
    labels: { colors: '#a3a3a3' },
    fontFamily: MONO,
  },
  yaxis: {
    labels: { style: { fontFamily: MONO } },
  },
  xaxis: {
    type: 'datetime',
    axisBorder: { color: '#2e2e2e' },
    axisTicks: { color: '#2e2e2e' },
    labels: { style: { fontFamily: MONO } },
  },
})

const end = ref(null)
const start = ref(null)
const statistics = ref(null)
const period = ref('day')
const periods = ref([
  { value: 'day', name: $gettext('Day') },
  { value: 'week', name: $gettext('Week') },
  { value: 'month', name: $gettext('Month') },
  { value: 'year', name: $gettext('Year') },
])

function getColors() {
  if (_props.graphicName === 'averagetraffic') {
    return ['#7c5cff', '#41d1cc', '#ff5b3a', '#3ddc84', '#ffb020', '#a594ff']
  }
  return ['#7c5cff', '#41d1cc']
}

function setCustomPeriod() {
  period.value = 'custom'
  fetchStatistics()
}
function setPeriod(newPeriod) {
  if (newPeriod !== period.value) {
    period.value = newPeriod
    fetchStatistics()
  }
}
function fetchStatistics() {
  const args = {
    graphSet: _props.graphicSet,
    period: period.value,
    graphicName: _props.graphicName,
  }
  if (_props.domain) {
    args.searchQuery = _props.domain.name
  }
  if (period.value === 'custom') {
    args.start = start.value.toISOString().split('T')[0]
    args.end = end.value.toISOString().split('T')[0]
  }
  statisticsApi.getStatistics(args).then((resp) => {
    statistics.value = resp.data.graphs[_props.graphicName]
  })
}

onMounted(() => {
  fetchStatistics()
})
watch(
  () => _props.graphicName,
  () => {
    options.value.colors = getColors()
  },
  { immediate: true }
)
</script>

<style scoped>
.v-card {
  z-index: 5;
}
</style>
