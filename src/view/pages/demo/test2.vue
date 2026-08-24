<template>
  <div class="flow-board">
    <div class="toggle-search-bar">
      <el-button size="mini" plain :icon="search_panel_visible ? 'el-icon-arrow-up' : 'el-icon-arrow-down'" @click="search_panel_visible=!search_panel_visible">
        {{search_panel_visible ? '隐藏搜索' : '显示搜索'}}
      </el-button>
    </div>

    <el-card v-show="search_panel_visible" shadow="never" class="search-card">
      <el-form :inline="true" size="mini" @submit.native.prevent>
        <el-form-item label="设备IP">
          <el-input placeholder="设备IP" v-model="filter_ip" @keyup.enter.native="searchPorts" clearable></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="isload" @click="searchPorts">搜索</el-button>
        </el-form-item>
      </el-form>

      <el-form v-if="port_list.length>0" :inline="true" size="mini" class="table-filter-form">
        <el-form-item label="端口名">
          <el-input placeholder="端口名过滤" v-model="table_filter_ifname" clearable></el-input>
        </el-form-item>
        <el-form-item label="端口描述">
          <el-input placeholder="端口描述过滤" v-model="table_filter_alias" clearable></el-input>
        </el-form-item>
      </el-form>

      <el-table
        v-if="port_list.length>0"
        :data="filtered_port_list"
        border
        size="mini"
        max-height="300"
        style="width: 100%;">
        <el-table-column prop="sysname" label="设备名" show-overflow-tooltip min-width="15" align="center"></el-table-column>
        <el-table-column prop="ip" label="设备IP" show-overflow-tooltip min-width="12" align="center"></el-table-column>
        <el-table-column prop="if_name" label="端口名" show-overflow-tooltip min-width="10" align="center"></el-table-column>
        <el-table-column prop="alias" label="描述" show-overflow-tooltip min-width="15" align="center"></el-table-column>
        <el-table-column prop="oper_statu" label="物理状态" :formatter="transOperStatu" min-width="8" align="center"></el-table-column>
        <el-table-column label="操作" min-width="8" align="center">
          <template v-slot="scope">
            <el-button size="mini" type="success" plain @click="addCard(scope.row)">添加看板</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <div class="card-grid">
      <el-card v-for="card in cards" :key="card.key" shadow="hover" class="flow-card">
        <div slot="header" class="flow-card-header">
          <span>{{card.port_info.sysname}} - {{card.port_info.if_name}}</span>
          <el-button type="text" icon="el-icon-close" @click="removeCard(card.key)"></el-button>
        </div>
        <echart_flow
          :chartsname="card.key"
          :port_info="card.port_info"
          :chartswidth="'100%'"
          :chartsheight="'320px'"
          :interval="card.interval">
        </echart_flow>
      </el-card>
    </div>

    <el-empty v-if="cards.length===0" description="暂无看板，从上方搜索结果中添加"></el-empty>

    <el-dialog title="设置采集间隔" :visible.sync="interval_dialog_visible" width="360px">
      <el-form label-width="90px" size="mini">
        <el-form-item label="设备名">
          <span>{{pending_row.sysname}}</span>
        </el-form-item>
        <el-form-item label="端口名">
          <span>{{pending_row.if_name}}</span>
        </el-form-item>
        <el-form-item label="采集间隔(秒)">
          <el-input-number v-model="pending_interval" :min="1" :max="300" size="mini"></el-input-number>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button size="mini" @click="interval_dialog_visible=false">取消</el-button>
        <el-button size="mini" type="primary" @click="confirmAddCard">确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import collector_api from "@/api/mapis/collector_interface.js"
import echart_flow from "@/components/echarts/echart_single_flow.vue"

export default {
  components: {
    echart_flow
  },
  computed: {
    filtered_port_list() {
      let ifname_kw = this.table_filter_ifname.trim().toLowerCase()
      let alias_kw = this.table_filter_alias.trim().toLowerCase()
      return this.port_list.filter(function (row) {
        if (ifname_kw !== "" && !(row.if_name || "").toLowerCase().includes(ifname_kw)) {
          return false
        }
        if (alias_kw !== "" && !(row.alias || "").toLowerCase().includes(alias_kw)) {
          return false
        }
        return true
      })
    }
  },
  data() {
    return {
      filter_ip: "",

      search_panel_visible: true,

      isload: false,
      port_list: [],
      table_filter_ifname: "",
      table_filter_alias: "",

      cards: [],
      card_seq: 0,

      interval_dialog_visible: false,
      pending_row: {},
      pending_interval: 15,
    };
  },
  methods: {
    searchPorts() {
      this.filter_ip = this.filter_ip.trim()
      if (this.filter_ip === "") {
        this.$message({
          type: 'error',
          message: '请输入设备IP'
        });
        return
      }

      let that = this
      this.isload = true
      collector_api.getPorts_ex({ ip: this.filter_ip }, {}).then(function (response) {
        if (response.data["code"] === 0) {
          that.port_list = response.data["data"]
          if (that.port_list.length === 0) {
            that.$message({
              type: 'warning',
              message: '未查询到匹配的端口'
            });
          }
        } else {
          that.$message({
            type: 'error',
            message: '查询失败，请重试'
          });
        }
        that.isload = false
      }).catch(function (error) {
        console.log(error)
        that.isload = false
        that.$message({
          type: 'error',
          message: '查询失败，请重试'
        });
      })
    },

    addCard(row) {
      this.pending_row = row
      this.pending_interval = 15
      this.interval_dialog_visible = true
    },

    confirmAddCard() {
      this.card_seq += 1
      let row = this.pending_row
      this.cards.push({
        key: "flow_board_card_" + this.card_seq,
        interval: this.pending_interval,
        port_info: {
          ip: row["ip"],
          if_name: row["if_name"],
          port_id: row["port_id"],
          sysname: row["sysname"],
          alias: row["alias"] || "-",
        }
      })
      this.interval_dialog_visible = false
    },

    removeCard(key) {
      this.cards = this.cards.filter(function (card) {
        return card.key !== key
      })
    },

    transOperStatu(row) {
      return row.oper_statu === '1' ? "up" : "down"
    },
  }
};
</script>

<style lang="scss" scoped>
.flow-board {
  padding: 10px;

  .toggle-search-bar {
    margin-bottom: 5px;
  }

  .search-card {
    margin-bottom: 10px;
  }

  .card-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .flow-card {
    width: 480px;
  }

  .flow-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
