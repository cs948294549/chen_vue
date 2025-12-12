<template>
  <div>
    <div>
      <el-button type="primary" @click="diag_flag=true;feature_uri={'page_id':page_info['page_id']};" size="mini">新建接口</el-button>
    </div>
    <div>
      <div>
        <el-row>
          <el-form style="text-align: right; margin-right: 5px;" size="mini" :inline="true">
            <el-form-item label="URI">
              <el-input placeholder="URI" v-model="filter_uri" @keyup.enter.native="searchKey" clearable></el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="isload" @click="searchKey">筛选</el-button>
            </el-form-item>
          </el-form>
        </el-row>
      </div>
      <div>
        <el-table :data="table_data" size="mini">
          <!-- <el-table-column prop="uri_id" label="ID" show-overflow-tooltip align='left' min-width="50"></el-table-column>
          <el-table-column prop="page_id" label="页面ID" show-overflow-tooltip align='left' min-width="50"></el-table-column> -->
          <el-table-column prop="uri" label="接口" show-overflow-tooltip align='left' min-width="50"></el-table-column>
          <el-table-column prop="privilege" label="权限" show-overflow-tooltip align='left' min-width="50">
            <template slot-scope="scope">
                <el-tag v-if="scope.row.privilege === '0'" type="success">只读</el-tag>
                <el-tag v-else type="primary">管理</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="descr" label="描述" show-overflow-tooltip align='left' min-width="80"></el-table-column>
          <el-table-column label="操作" show-overflow-tooltip align='left' min-width="50">
            <template slot-scope="scope">
              <el-button @click="updateRow(scope.row)" type="success" icon="el-icon-edit-outline" size="mini">修改</el-button>
              <el-button @click="deleteRow(scope.row, scope.$index)" type="danger" icon="el-icon-circle-close" size="mini">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
    <el-dialog title="创建角色" :visible.sync="diag_flag" width="50%" append-to-body>
      <el-form v-model="feature_uri" size="mini" label-width="80px">
        <el-form-item label="页面ID">
          <el-input style="width: 500px;" placeholder="页面ID" v-model="feature_uri.page_id" disabled readonly></el-input>
        </el-form-item>
        <el-form-item label="接口">
          <el-input style="width: 500px;" placeholder="接口" v-model="feature_uri.uri" clearable></el-input>
        </el-form-item>
        <el-form-item label="描述信息">
          <el-input style="width: 500px;" type="textarea" :rows='3' resize="none" placeholder="描述信息" v-model="feature_uri.descr"></el-input>
        </el-form-item>
        <el-form-item label="权限">
          <el-select style="width: 200px;" v-model='feature_uri.privilege' filterable placeholder="请选择权限" clearable>
            <el-option v-for='item in privilege_list' :key='item.value' :label='item.label' :value='item.value'></el-option>
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="isload" @click="submit_create()">确认</el-button>
          <el-button type="primary" @click="diag_flag=false">取消</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>

    <el-dialog title="修改信息" :visible.sync="diag_update_flag" width="50%" append-to-body>
      <el-form v-model="feature_uri" size="mini" label-width="80px">
        <el-form-item label="urlID">
          <el-input style="width: 500px;" placeholder="urlID" v-model="feature_uri.uri_id" disabled readonly></el-input>
        </el-form-item>
        <el-form-item label="页面ID">
          <el-input style="width: 500px;" placeholder="页面ID" v-model="feature_uri.page_id" disabled readonly></el-input>
        </el-form-item>
        <el-form-item label="接口">
          <el-input style="width: 500px;" placeholder="接口" v-model="feature_uri.uri" clearable></el-input>
        </el-form-item>
        <el-form-item label="描述信息">
          <el-input style="width: 500px;" type="textarea" :rows='3' resize="none" placeholder="描述信息" v-model="feature_uri.descr"></el-input>
        </el-form-item>
        <el-form-item label="权限">
          <el-select style="width: 200px;" v-model='feature_uri.privilege' filterable placeholder="请选择权限" clearable>
            <el-option v-for='item in privilege_list' :key='item.value' :label='item.label' :value='item.value'></el-option>
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="isload" @click="submit_update()">确认</el-button>
          <el-button type="primary" @click="diag_update_flag=false">取消</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script>
  import uri_api from "@/api/mapis/user_interface.js"


  export default {
    props:{
      page_info:{
      	type:Object,
      	default:()=>{
      		return {};
      	}
      },
    },
    name: 'uri_manage',
    data() {
      return {

        //table 用
        filter_uri:"",
        isload:false,


        refresh_flag:false,
        table_data:[
          // {"rid":"admin","group_name":"管理原", "descr":"系统管理"}
        ],
        table_header:[
          {"key":"rid","label":"角色ID","width":"120"},
          {"key":"name","label":"角色名称","width":"120"},
          {"key":"descr","label":"角色描述","width":"240"},
        ],
        tab_single_btns:[
          {"label":"修改","type":"primary","click":"updateRow"},
          {"label":"删除","type":"danger","click":"deleteRow"}
        ],

        privilege_list:[
          {"label":"只读", "value": "0"},
          {"label":"管理", "value": "1"},
        ],
        diag_flag:false,
        feature_uri:{},

        diag_update_flag:false,

      };
    },
    mounted() {
      // console.log("查看当前页面==", this.page_info)
      this.searchKey()
    },
    methods:{
      searchKey(){
        //查询信息
        let post_data = {
          "page_id": this.page_info["page_id"]
        }

        this.filter_uri = this.filter_uri.replace(/^\s*|\s*$/g,"")
        if(this.filter_uri!=""){
          post_data["uri_reg"] = this.filter_uri
        }

        let that = this
        this.isload=true
        this.table_data=[]
        uri_api.getUriList(post_data,{}).then(function(response){
          if(response.data.code==0){
            that.table_data = response.data.data
          }else{
            that.$message({
              type: 'error',
              message: '查询失败，请重试'+response.data.msg
            });
          }
          that.isload=false
        }).catch(function (error) {
            console.log(error)
            that.isload=false
            that.$message({
              type: 'error',
              message: '查询失败，请重试'
            });
        })
      },

      submit_create(){
        //提交信息
        let that = this
        this.isload=true
        let post_data = {
          "page_id":this.feature_uri["page_id"],
          "uri":this.feature_uri["uri"],
          "descr":this.feature_uri["descr"],
          "privilege":this.feature_uri["privilege"],
        }
        //"page_id", "uri", "descr", "privilege"
        uri_api.addUri(post_data,{}).then(function(response){
          if(response.data.code==0){
            that.diag_flag=false
            that.searchKey()
            that.$message({
              type: 'success',
              message: '添加完成'
            });
          }else{
            that.$message({
              type: 'error',
              message: '添加失败，原因:'+response.data.message
            });
          }
          that.isload=false
        }).catch(function (error) {
            console.log(error)
            that.isload=false
            that.$message({
              type: 'error',
              message: '操作失败，请重试'
            });
        })
      },
      updateRow(row){
        //更新或查看信息
        this.feature_uri = {}
        this.$set(this.feature_uri, 'uri_id', row["uri_id"])
        this.$set(this.feature_uri, 'page_id', row["page_id"])
        this.$set(this.feature_uri, 'uri', row["uri"])
        this.$set(this.feature_uri, 'descr', row["descr"])
        this.$set(this.feature_uri, 'privilege', row["privilege"])

        this.diag_update_flag=true;
      },

      submit_update(){
        //提交信息
        let that = this
        this.isload=true
        let post_data = {
          "uri_id":this.feature_uri["uri_id"],
          "uri":this.feature_uri["uri"],
          "descr":this.feature_uri["descr"],
          "privilege":this.feature_uri["privilege"],
        }
        uri_api.updateUri(post_data,{}).then(function(response){
          if(response.data.code==0){
            that.diag_update_flag=false
            that.searchKey()
            that.$message({
              type: 'success',
              message: '更新完成'
            });
          }else{
            that.$message({
              type: 'error',
              message: '更新失败，原因:'+response.data.message
            });
          }
          that.isload=false
        }).catch(function (error) {
            console.log(error)
            that.isload=false
            that.$message({
              type: 'error',
              message: '操作失败，请重试'
            });
        })
      },

      deleteRow(val, rowid){
        this.$confirm('删除当前记录?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          let that = this
          uri_api.delUri({"uri_id":val.uri_id}, {}).then(function(response){
            if(response.data.code==0){
              that.$message({
                type: 'success',
                message: "删除成功"
              });
              that.searchKey()
            }else{
              that.$message({
                type: 'error',
                message: "删除失败,原因:"+response.data.message
              });
            }
          }).catch(function (error) {
              console.log(error)
              that.$message({
                type: 'error',
                message: "删除异常"
              });
          })
        }).catch(() => {
          this.$message({
            type: 'info',
            message: '取消操作'
          });
        });
      },
    },
    components:{

    },
  }
</script>

<style>
</style>
