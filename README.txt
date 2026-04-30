windows部署打开局域网防火墙
netsh advfirewall firewall add rule name="允许 8000 端口" dir=in action=allow protocol=TCP localport=8000

创建虚拟环境
python -m venv venv

加载虚拟环境
./venv/Scripts/Activate.ps1

安装依赖
pip install -r requirements.txt


#--------github--------

git init
git add .
git commit -m "最新版本"
git branch -M master
git remote set-url origin git@github.com:DeanFan1994/OpenLOA-web.git
git push -u origin master



强制同步仓库版本到本地
# 第一步：从远程获取最新版本库（不修改你本地代码）
git fetch origin
# 第二步：强制重置本地分支
git reset --hard origin/master

删除git(gitbash)
rm -rf .git


#-----------本地生成ssh秘钥文件------------
新建秘钥
ssh-keygen -t ed25519 -C "DingFan"
查看秘钥内容
cat ~/.ssh/id_ed25519.pub

