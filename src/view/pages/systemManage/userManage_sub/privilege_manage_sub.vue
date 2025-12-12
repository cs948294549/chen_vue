<template>
  <div style="margin: 10px;">
    <el-button type="primary" icon="el-icon-circle-plus-outline" size="small" @click="dialogVisible=true;" plain style="margin-bottom: 10px">添加页面权限</el-button>
    <el-table ref="role_page_t" :data="roleTableData" row-key="page_id" :tree-props="{children: 'children'}" size="mini">
      <el-table-column prop="page_id" label="菜单ID" show-overflow-tooltip align='left' min-width="50"></el-table-column>
      <el-table-column prop="name" label="菜单名称" show-overflow-tooltip align='left' min-width="50"></el-table-column>

      <el-table-column prop="page_pri" label="权限" show-overflow-tooltip align='left' min-width="50">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.page_pri === '0'" type="success">只读</el-tag>
          <el-tag v-else type="primary">管理</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" show-overflow-tooltip align='left' min-width="50">
        <template slot-scope="scope">
          <el-button @click="handleEdit(scope.row)" type="text" icon="el-icon-sort"></el-button>
          <el-button @click="handleDelete(scope.$index, scope.row)" type="text" icon="el-icon-circle-close"></el-button>
        </template>
      </el-table-column>
    </el-table>


    <el-dialog title="新增权限" width="50%" :visible.sync="dialogVisible" destroy-on-close :close-on-click-modal="false" append-to-body>
      <el-table ref="all_page_t" :data="allTableData" row-key="page_id" :tree-props="{children: 'children'}" @selection-change="handleSelectionChange" size="mini">
        <el-table-column type='selection' width='50'></el-table-column>
        <el-table-column prop="page_id" label="菜单ID" show-overflow-tooltip align='left' min-width="50"></el-table-column>
        <el-table-column prop="name" label="菜单名称" show-overflow-tooltip align='left' min-width="50"></el-table-column>
        <el-table-column prop="page_pri" label="权限" show-overflow-tooltip align='left' min-width="50">
          <template slot-scope="scope">
            <el-switch
              style="display: block"
              v-model="scope.row.page_pri"
              active-color="#13ce66"
              inactive-color="#409EFF"
              active-text="管理"
              inactive-text="只读">
            </el-switch>
          </template>
        </el-table-column>
      </el-table>
      <div>
        <el-button type="primary" :loading="isload" @click="submitCreateForm" size="small">确定</el-button>
        <el-button @click="dialogVisible=false" size="small" type="info">取消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import page_api from "@/api/mapis/user_interface.js"

export default {
  props:{
    role_info:{
    	type:Object,
    	default:()=>{
    		return {};
    	}
    },
  },
  data () {
    return {
      page_ids:[],

      //角色已有的菜单列表
      roleTableData:[],
      allTableData:[],

      choosePages:[],

      //新增权限
      dialogVisible:false,

      isload:false,
    }
  },
  mounted () {
    this.getCurrentPageList()
    this.getAllPageList()
  },
  methods: {
    handleSelectionChange(val){
      this.choosePages=val
    },

    getAllPageList () {
      let that = this
      page_api.getPageList({},{}).then(function (response) {
        that.allTableData = response.data.data
      })
      .catch(function (error) {
        console.log(error)
      })
    },

    getCurrentPageList () {
      let that = this
      this.roleTableData=[]
      this.page_ids=[]
      page_api.getRolePageList({"rid": this.role_info["rid"]},{}).then(function (response) {
        that.roleTableData = response.data.data
        that.roleTableData.forEach(item => {
          that.page_ids.push(parseInt(item["page_id"]))
          if(item["children"]&&item["children"].length>0){
            item["children"].forEach(child_item => {
              that.page_ids.push(parseInt(child_item["page_id"]))
            })
          }
        });
      })
      .catch(function (error) {
        console.log(error)
      })
    },
    handleEdit (row) {
      let that = this
      let target_pri='0'
      let target_label='只读'
      if(row["page_pri"]=='0'){
        target_pri = "1"
        target_label = "管理"
      }else{
        target_pri = "0"
        target_label = "只读"
      }
      that.$confirm('确定切换页面权限到【'+target_label+'】?', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
      }).then(() => {
        page_api.updateRolePage({"rid":this.role_info["rid"],"page_id":row["page_id"],"privilege":target_pri},{}).then(function (response) {
          if(response.data.code==0){
            that.$message({
              type: 'success',
              message: '切换成功'
            });
            that.getCurrentPageList()
          }else{
            that.$message({
              type: 'error',
              message: '切换失败，请重试'+response.data.message
            });
          }
        })
        .catch(function (error) {
          console.log(error)
        })
      }).catch(function (error) {
          console.log(error)
      })
    },

    handleDelete (index, row) {
      let that = this
      that.$confirm('确定删除该条目?', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
      }).then(() => {
        page_api.delRolePage({"rid":this.role_info["rid"],"page_id":row["page_id"]},{}).then(function (response) {
          if(response.data.code==0){
            that.$message({
              type: 'success',
              message: '删除成功'
            });
            that.getCurrentPageList()
          }else{
            that.$message({
              type: 'error',
              message: '删除失败，请重试'+response.data.message
            });
          }
        })
        .catch(function (error) {
          console.log(error)
        })
      }).catch(function (error) {
          console.log(error)
      })
    },

    submitCreateForm(){
      let post_data=[]
      this.choosePages.forEach(item=>{
        if(this.page_ids.indexOf(item["page_id"])<=-1){
          post_data.push({
            "rid": this.role_info["rid"],
            "page_id":item["page_id"],
            "privilege":item["page_pri"]===true?'1':'0',
          })
        }
      });

      if(post_data.length<=0){
        this.$message({
          type: 'warning',
          message: '无页面添加'
        });
        return
      }
      let that = this
      this.isload=true
      page_api.addRolePageList({"page_list":post_data},{}).then(function (response) {
        if(response.data.code==0){
          that.$message({
            type: 'success',
            message: '添加成功'
          });
          that.getCurrentPageList()
          that.dialogVisible=false
        }else{
          that.$message({
            type: 'error',
            message: '添加失败，请重试'+response.data.message
          });
        }
        that.isload=false
      })
      .catch(function (error) {
        that.isload=false
        console.log(error)
      })
    },

  },
  components:{

  }
}
</script>

<style>
.el-icon-circle-plus-outline {
  color: white !important;
}
</style>
