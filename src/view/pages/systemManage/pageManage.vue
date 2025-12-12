<template>
  <div style="margin: 10px;">
    <el-button type="primary" icon="el-icon-circle-plus-outline" size="small" @click="dialogVisible=true;editForm={}" plain style="margin-bottom: 10px">添加菜单</el-button>
    <el-table :data="routerTableData" row-key="page_id" :tree-props="{children: 'children'}" @selection-change="handleSelectionChange" size="mini">
      <!-- <el-table-column type='selection' width='50'></el-table-column> -->
      <el-table-column prop="page_id" label="菜单ID" show-overflow-tooltip align='left' min-width="50"></el-table-column>
      <el-table-column prop="name" label="菜单名称" show-overflow-tooltip align='left' min-width="50"></el-table-column>
      <el-table-column prop="path" label="菜单路径" show-overflow-tooltip align='left' min-width="80"></el-table-column>
      <el-table-column prop="p_type" label="菜单类型" show-overflow-tooltip align='left' min-width="50">
        <template slot-scope="scope">
          <!-- <el-tag :type="scope.row.type === 'dir' ? 'primary' : scope.row.type === 'router' ? 'success' : 'warning'" disable-transitions> -->
            {{ scope.row.p_type === '0' ? '目录':'路由'}}
          <!-- </el-tag> -->
        </template>
      </el-table-column>
      <el-table-column prop="classify" label="路径分组" show-overflow-tooltip align='left' min-width="30"></el-table-column>
      <el-table-column prop="sort_num" label="菜单顺序" show-overflow-tooltip align='left' min-width="30"></el-table-column>
      <el-table-column prop="hide" label="隐藏页面" show-overflow-tooltip align='left' min-width="50">
        <template slot-scope="scope">
            {{ scope.row.hide===1? '是' : '否' }}
          <!-- </el-tag> -->
        </template>
      </el-table-column>
      <el-table-column prop="icon" label="菜单图标" show-overflow-tooltip align='left' min-width="50">
        <template slot-scope="scope">
          <i :class="scope.row.icon"></i>
        </template>
      </el-table-column>
      <el-table-column label="操作" show-overflow-tooltip align='left' min-width="50">
        <template slot-scope="scope">
          <el-button @click="handleUri(scope.row)" type="text" icon="el-icon-tickets"></el-button>
          <el-button @click="handleEdit(scope.row)" type="text" icon="el-icon-edit-outline"></el-button>
          <el-button @click="handleDelete(scope.$index, scope.row)" type="text" icon="el-icon-circle-close"></el-button>
        </template>
      </el-table-column>
    </el-table>


    <el-dialog title="新增页面" width="50%" :visible.sync="dialogVisible" destroy-on-close :close-on-click-modal="false" append-to-body>
      <el-form label-width="100px" ref="create_form" :rules="form_rules" :model="editForm">
        <el-form-item label="类型" prop="p_type">
          <el-select v-model="editForm.p_type" placeholder="请选择类型">
            <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item v-if="editForm.p_type === 'router'" label="父级菜单">
          <el-select v-model="editForm.parent_id" placeholder="请选择父级菜单" clearable>
            <el-option v-for="item in PDirOptions" :key="item.value" :label="item.label" :value="item.value"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="editForm.p_type === 'dir' ? '菜单名称' : '路由名称'" prop="name">
          <el-input v-model="editForm.name"></el-input>
        </el-form-item>
        <el-form-item :label="editForm.p_type === 'dir' ? '菜单分组' : '路由分组'" prop="classify">
          <el-input v-model="editForm.classify"></el-input>
        </el-form-item>
        <el-form-item :label="editForm.p_type === 'dir' ? '菜单路径' : '路由路径'">
          <el-input v-model="editForm.path"></el-input>
        </el-form-item>
        <el-form-item :label="editForm.p_type === 'dir' ? '菜单图标' : '路由图标'">
          <el-input v-model="editForm.icon"></el-input>
        </el-form-item>
        <el-form-item :label="editForm.p_type === 'dir' ? '菜单顺序' : '路由顺序'">
          <el-input v-model="editForm.sort_num"></el-input>
        </el-form-item>
        <el-form-item label="描述信息">
          <el-input v-model="editForm.descr"></el-input>
        </el-form-item>
        <el-form-item label="隐藏页面">
          <el-switch v-model="editForm.hide"></el-switch>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="isload" @click="submitCreateForm" size="small">确定</el-button>
          <el-button @click="editForm={}" size="small" type="info">重置</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>

    <el-dialog title="修改页面属性" width="50%" :visible.sync="dialogUpdateVisible" destroy-on-close :close-on-click-modal="false" append-to-body>
      <el-form label-width="100px" ref="create_form" :rules="form_rules" :model="editForm">
        <el-form-item label="类型" prop="page_id">
          <el-input style="width: 500px;" placeholder="角色ID" v-model="editForm.page_id" disabled readonly></el-input>
        </el-form-item>
        <el-form-item label="类型" prop="p_type">
          <el-select v-model="editForm.p_type" placeholder="请选择类型">
            <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item v-if="editForm.p_type === 'router'" label="父级菜单">
          <el-select v-model="editForm.parent_id" placeholder="请选择父级菜单" clearable>
            <el-option v-for="item in PDirOptions" :key="item.value" :label="item.label" :value="item.value"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="editForm.p_type === 'dir' ? '菜单名称' : '路由名称'" prop="name">
          <el-input v-model="editForm.name"></el-input>
        </el-form-item>
        <el-form-item :label="editForm.p_type === 'dir' ? '菜单分组' : '路由分组'" prop="classify">
          <el-input v-model="editForm.classify"></el-input>
        </el-form-item>
        <el-form-item :label="editForm.p_type === 'dir' ? '菜单路径' : '路由路径'">
          <el-input v-model="editForm.path"></el-input>
        </el-form-item>
        <el-form-item :label="editForm.p_type === 'dir' ? '菜单图标' : '路由图标'">
          <el-input v-model="editForm.icon"></el-input>
        </el-form-item>
        <el-form-item :label="editForm.p_type === 'dir' ? '菜单顺序' : '路由顺序'">
          <el-input v-model="editForm.sort_num"></el-input>
        </el-form-item>
        <el-form-item label="描述信息">
          <el-input v-model="editForm.descr"></el-input>
        </el-form-item>
        <el-form-item label="隐藏页面">
          <el-switch v-model="editForm.hide"></el-switch>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="isload" @click="submitUpdateForm" size="small">确定</el-button>
          <el-button type="info" @click="dialogUpdateVisible=false" size="small">取消</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>


    <el-drawer :title="'【'+uri_title+'】接口列表'" :visible.sync="dialog_uri_flag" :direction="'rtl'" size="60%" destroy-on-close append-to-body>
      <Card_uri
        style="margin: 10px;"
        v-if="dialog_uri_flag"
        v-bind:page_info="page_info_cache"
      ></Card_uri>
    </el-drawer>

  </div>
</template>

<script>
import page_api from "@/api/mapis/user_interface.js"
import Card_uri from './pageManage_sub/uri_manage_sub.vue';

export default {
  data () {
    return {
      routerTableData: [],
      form_rules: {
        p_type: [
          { required: true, message: '请选择类型', trigger: 'change' }
        ],
        parent_id: [
          { required: true, message: '请选择父级菜单', trigger: 'change' }
        ],
        path: [
          { required: true, message: '请选择父级菜单', trigger: 'blur' }
        ],
      },
      //选项卡，目录or路由
      typeOptions: [{label: '目录', value: 'dir'}, {label: '路由', value: 'router'}],

      //父级目录
      PDirOptions: [],

      isload:false,

      //新增数据
      dialogVisible: false,
      editForm: {},

      //修改数据
      dialogUpdateVisible:false,

      //页面接口管理
      dialog_uri_flag:false,
      uri_title:"",
      page_info_cache:{}

    }
  },
  mounted () {
    this.getList()
    this.getRoutes_test()
    
  },
  methods: {
    getRoutes_test(){
      let that = this
      page_api.getRoleRouteList({},{}).then(function (response) {
        console.log("route===",response.data)
      })
      .catch(function (error) {
        console.log(error)
      })
    },
    
    handleEdit (row) {
      console.log(row)
      this.editForm = {}
      this.$set(this.editForm, 'page_id', row["page_id"])
      if(row["p_type"]=='0'){
        this.$set(this.editForm, 'p_type', "dir")
      }else{
        this.$set(this.editForm, 'p_type', "router")
      }
      if(row["parent_id"]==0){
        this.$set(this.editForm, 'parent_id', "")
      }else{
        this.$set(this.editForm, 'parent_id', row["parent_id"])
      }

      this.$set(this.editForm, 'name', row["name"])
      this.$set(this.editForm, 'classify', row["classify"])
      this.$set(this.editForm, 'path', row["path"])
      this.$set(this.editForm, 'icon', row["icon"])
      this.$set(this.editForm, 'sort_num', row["sort_num"])
      this.$set(this.editForm, 'descr', row["descr"])
      if(row["hide"]=="0"){
        this.$set(this.editForm, 'hide', false)
      }else{
         this.$set(this.editForm, 'hide', true)
      }

      this.dialogUpdateVisible = true
    },

    handleDelete (index, row) {
      let that = this
      that.$confirm('确定删除该条目?', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
      }).then(() => {
        console.log("删除页面", row)
        page_api.delPage({"page_id":row["page_id"]},{}).then(function (response) {
          if(response.data.code==0){
            that.$message({
              type: 'success',
              message: '删除成功'
            });
            that.getList()
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
      console.log("菜单信息==",JSON.stringify(this.editForm))
      let base_data = {
        "name":"",
        "classify":"默认分组",
        "sort_num":"1",
        "path":"",
        "p_type":"dir",
        "descr":"",
        "hide":false,
        "parent_id":0,
        "icon":""
      }
      let post_data={
        ...base_data,
        ...this.editForm
      }
      //处理数据格式
      post_data["parent_id"] = parseInt(post_data["parent_id"])
      if(post_data["parent_id"]!=0){
        if(post_data["classify"]=="默认分组"){
          post_data["classify"]=""
        }
      }
      if(post_data["path"]==""){
        post_data["p_type"]="0"
      }else{
        post_data["p_type"]="1"
      }
      if(post_data["hide"]===false){
        post_data["hide"]="0"
      }else{
        post_data["hide"]="1"
      }

      console.log("新增数据===",JSON.stringify(post_data))
      let that = this
      this.isload=true
      page_api.addPage(post_data,{}).then(function (response) {
        console.log("page add===",response.data)
        if(response.data.code==0){
          that.$message({
            type: 'success',
            message: '添加成功'
          });
          that.getList()
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


      // this.$refs["create_form"].validate((valid) => {
      //   if (valid) {
      //     alert('submit!');
      //   } else {
      //     console.log('error submit!!');
      //     return false;
      //   }
      // });

    },

    submitUpdateForm(){
      let post_data={
        ...this.editForm
      }
      //处理数据格式

      post_data["parent_id"] = parseInt(post_data["parent_id"])
      if(post_data["parent_id"]!=0){
        if(post_data["classify"]=="默认分组"){
          post_data["classify"]=""
        }
      }
      if(Number.isNaN(post_data["parent_id"])){
        post_data["parent_id"]=0
      }

      if(post_data["path"]==""){
        post_data["p_type"]="0"
      }else{
        post_data["p_type"]="1"
      }
      if(post_data["hide"]===false){
        post_data["hide"]="0"
      }else{
        post_data["hide"]="1"
      }

      console.log("更新数据==", JSON.stringify(post_data))
      let that = this
      this.isload=true
      page_api.updatePage(post_data,{}).then(function (response) {
        console.log("page add===",response.data)
        if(response.data.code==0){
          that.$message({
            type: 'success',
            message: '更新成功'
          });
          that.getList()
          that.dialogUpdateVisible=false
        }else{
          that.$message({
            type: 'error',
            message: '更新失败，请重试'+response.data.message
          });
        }
        that.isload=false
      })
      .catch(function (error) {
        that.isload=false
        console.log(error)
      })
    },

    getList () {
      let that = this
      page_api.getPageList({},{}).then(function (response) {
        that.routerTableData = response.data.data
        console.log("页面列表==",response.data)
        that.PDirOptions = []
        that.routerTableData.forEach(item => {
          if (item.path === '') that.PDirOptions.push({label: item.name, value: item.page_id})
        })
      })
      .catch(function (error) {
        console.log(error)
      })
    },

    handleUri(row){
      console.log("查询页面相关接口列表，并打开列表的增删改查")
      this.uri_title=row["name"]
      this.page_info_cache=row
      this.dialog_uri_flag=true
    },

    handleSelectionChange(val){
      console.log("多选==",val)
    },
  },
  components:{
    Card_uri
  }
}
</script>

<style>
.el-icon-circle-plus-outline {
  color: white !important;
}
</style>
