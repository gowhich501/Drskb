import pandas as pd
import requests
"""---------------------------------------
設定:DMMのアフィリエイトIDとAPI IDを指定します
---------------------------------------"""
DMM_AFFILIATE_ID = "gowhich-991"
DMM_API_ID = "V0eANVckdeEtzu7cFnRk"
API_END_POINT = "https://api.dmm.com/affiliate/v3/ActressSearch?api_id=" + DMM_API_ID + "&affiliate_id=" + DMM_AFFILIATE_ID + "&keyword={}" + "&output=json"
"""---------------------------------------
カウンター
---------------------------------------"""
count = 0
skipped_count = 0
"""---------------------------------------
設定:DMMのアフィリエイトIDとAPI IDを指定します
---------------------------------------"""
df1 = pd.read_csv("output.csv") #女優名前データが入ったcsv
df = pd.read_csv('default.csv', index_col=0) #女優名・女優の画像URL・DMMの画像URLが列に入っている
for i, rows in df1.iterrows():
   name = rows["name"]
   image = rows["image"]
   try:
       end_point = API_END_POINT.format(name)
       r = requests.get(end_point)
       data = r.json()
       actress = data["result"]["actress"][0]["name"]
       if name == actress: #CSVの女優名とDMMの女優名が一致した場合
           dmmimage = data["result"]["actress"][0]["imageURL"]["large"]
           birthday = data["result"]["actress"][0]["birthday"]
           height = data["result"]["actress"][0]["height"]
           B = data["result"]["actress"][0]["bust"]
           C = data["result"]["actress"][0]["cup"]
           W = data["result"]["actress"][0]["waist"]
           H = data["result"]["actress"][0]["hip"]
           yomi = data["result"]["actress"][0]["ruby"]
           print("name={}".format(name))
           print("yomi={}".format(yomi))
           print("image={}".format(image))
           print("dmmimage={}".format(dmmimage))
           print("height={}".format(height))
           print("birthday={}".format(birthday))
           print("bust={}".format(B))
           print("cup={}".format(C))
           print("hip={}".format(H))
           print("waist={}".format(W))
   except Exception as e:
       print(e)
       skipped_count +=1
       print("{}をスキップしました:スキップ数:{}".format(name,skipped_count))
       dmmimage = ""
       birthday = ""
       height = ""
       B = ""
       C = ""
       H = ""
       W = ""
       yomi = ""
   se = pd.Series([name,yomi,image,dmmimage,height,birthday,B,C,W,H],["name","yomi","image","dmmimage","height","birthday","B","C","W","H"])
   df = df.append(se,ignore_index=True)
   print(df)
df.to_csv("final.csv")
print("DONE")