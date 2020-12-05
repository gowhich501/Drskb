// プロパティ取得
var PROPERTIES = PropertiesService.getScriptProperties();//ファイル > プロジェクトのプロパティから設定した環境変数的なもの

//LINE・DMMの設定をプロジェクトのプロパティから取得
var LINE_ACCESS_TOKEN = PROPERTIES.getProperty('LINE_ACCESS_TOKEN')
var LINE_END_POINT = "https://api.line.me/v2/bot/message/reply"

//MicroSoft Azure Face APIの設定
var FACE_API_SUBSCRIPTION_KEY = PROPERTIES.getProperty('FACE_API_SUBSCRIPTION_KEY')
var FACE_API_PERSON_GROUP = "idle"
var FACE_API_BASE_END_POINT = "https://westus2.api.cognitive.microsoft.com/face/v1.0/"

var reply_token;
var imageUrl;
var id;


//LINEのエンドポイント
function doGet() {
 return HtmlService.createTemplateFromFile("test").evaluate();
}

//LINEからPOSTリクエストを受けたときに起動する
function doPost(e){

 Logger.log("post受けました!")
 if (typeof e === "undefined"){
   /*
    * debug用の処理です
    */
   imageEndPoint = "https://www.akb48.co.jp/sousenkyo2017/70004.jpg"
 } else　{
   /*
    * Lineからメッセージが送られたときの処理です
    * URLを取得します
    */
   var json = JSON.parse(e.postData.contents)
   reply_token= json.events[0].replyToken
   console.log("reply_token: " + reply_token)
   imageEndPoint = json.events[0].message.text       

 }
   console.log("以下のURLから、画像を取得します: " + imageEndPoint)
   console.log(imageEndPoint)
   
   //画像データから、顔を検出し、似ているアイドルの名前とプロフィールのURLを取得します
   var faceId = detectFaceId(imageEndPoint)
   var personIdAndConfidence = getPersonIdAndConfidence(faceId)
   var personId = personIdAndConfidence["personId"]
   var confidence = personIdAndConfidence["confidence"]
   var personInfo = getActressName(personId)
   //Lineにアイドルの名前とプロフィールのURLを送信します
   sendLine(personInfo, confidence)
   //logFile.getBody().appendParagraph(Logger.getLog());
}

function detectFaceId(uri){
 end_point = FACE_API_BASE_END_POINT + "detect?recognitionModel=recognition_03"
 try {
   payload = {
     "url":uri
   }
   headers = {
     "Ocp-Apim-Subscription-Key": FACE_API_SUBSCRIPTION_KEY,
     "Content-Type": "application/json"
   };
   var res = UrlFetchApp.fetch(
     end_point,
     {
       'method': 'POST',
       'headers': headers,
       'payload': JSON.stringify(payload)
     }
   );
   res = JSON.parse(res)
   faceId = res[0]["faceId"]
   Logger.log("faceId: " + faceId)
   return faceId
 } catch (e){
   console.log("faceIdの取得に失敗しました")
   console.log("エラーメッセージ：" + e)
   return e
 }
}
function getPersonIdAndConfidence(faceId){
 /*
 * faceIdから、personIdとconfidenceを取得します
 * @params
   - faceId{String}: 画像から検出されたfaceId
 * @return
   - personIdAndoConfidence{array}
     - personId
     - concidence
 */
 end_point = FACE_API_BASE_END_POINT + "identify"
 try{
     faceIds = [faceId] //faceIdsはリストで送信される
     payload = {
       "faceIds" :faceIds,
       "personGroupId" :FACE_API_PERSON_GROUP,
       "confidenceThreshold": 0.3
     }
     res = UrlFetchApp.fetch(
       end_point,
       {
         'method': 'POST',
         'headers': headers,
         'payload': JSON.stringify(payload)
         //'payload': payload
       }
     );
     res = JSON.parse(res)
     var personId = res[0]["candidates"][0]["personId"]
     var confidence = res[0]["candidates"][0]["confidence"]
     console.log("personIdを取得しました: " + personId )
     console.log("coincidenceを取得しました: " + confidence)
     personIdAndConfidence = {
       "personId": personId,
       "confidence": confidence
     }
     return personIdAndConfidence;
   } catch (e){
     console.log("personId・confidenceの取得に失敗しました")
     console.log(e)
     return e
 }
}
function getActressName(personId){
 /*
  * Face APIから取得したpersonIdから、アイドルの氏名とプロフィールURLを取得します
  * @ param
  *  - personId: Face APIで学習したpersonに紐づけられたID
  * @ return
  *  - personInfo
 */
 end_point = FACE_API_BASE_END_POINT + "persongroups/" + FACE_API_PERSON_GROUP + "/persons/" + personId
 try {
   res = UrlFetchApp.fetch(
     end_point,
     {
       'method': 'GET',
       'headers': headers
     }
   );
   res = JSON.parse(res)
   name = res["name"] 
   console.log("情報を取得しました: " + name)
   return res;
 } catch (e){
   console.log("取得できませんでした")
   console.log(e)
   return {"name":e}
 }
}

function sendLine(personInfo, coincidence){

 if (typeof personInfo["userData"] === "undefined"){
   console.log("推しが見つからなかった")
   var messages = [{
     "type": "template",
     "altText": "むむ...",
     "template": {
       "type": "buttons",
       "thumbnailImageUrl": "https://vignette.wikia.nocookie.net/dragonball/images/9/93/Senbei2.jpg/revision/latest?cb=20100509134406&path-prefix=ja",
       "title": "お前の願望には答えられなかった。",
       "text": "すまんが、好みのアイドルは見つからなかったよ。まだまだデータが必要ということか...",
     "actions": [
       {
       "type": "uri",
       "label": "博士",
       "uri": "https://drslump.fandom.com/ja/wiki/則巻千兵衛"
     }
     ]
   }
   }];
  
 } else{
   console.log("推しが見つかった")
   Logger.log("name: "+ personInfo["name"])
   Logger.log("profile: "+ personInfo["userData"])

   var messages = [{
     "type": "template",
     "altText": "おまえさんの推しはこの娘じゃ！！",
     "template": {
       "type": "buttons",
       // "thumbnailImageUrl": actressImageUrl,
       "title": personInfo["name"],
       "text": "一致度は" + (Math.round(coincidence * 100)) + "%じゃ",
       "actions": [
       {
       "type": "uri",
       "label": "プロフィールに移動！",
       "uri": personInfo["userData"]
     }
     ]
   }
   }];
  }
  console.log(message)
  
 try {
   UrlFetchApp.fetch(LINE_END_POINT, {
     'headers': {
       'Content-Type': 'application/json; charset=UTF-8',
       'Authorization': 'Bearer ' + LINE_ACCESS_TOKEN,
     },
     'method': 'post',
     'payload': JSON.stringify({
       'replyToken': reply_token,
       'messages': messages,
     }),
   });
   return ContentService.createTextOutput(JSON.stringify({'content': 'post ok'})).setMimeType(ContentService.MimeType.JSON);  
 } catch (e){
   console.log("LINEへのメッセージ送信に失敗しました")
   console.log(e)
 }
}
