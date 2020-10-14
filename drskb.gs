// プロパティ取得
var PROPERTIES = PropertiesService.getScriptProperties();//ファイル > プロジェクトのプロパティから設定した環境変数的なもの

//LINE・DMMの設定をプロジェクトのプロパティから取得
var LINE_ACCESS_TOKEN = PROPERTIES.getProperty('LINE_ACCESS_TOKEN')
var LINE_END_POINT = "https://api.line.me/v2/bot/message/reply"

//MicroSoft Azure Face APIの設定
var FACE_API_SUBSCRIPTION_KEY = PROPERTIES.getProperty('FACE_API_SUBSCRIPTION_KEY')
var FACE_API_PERSON_GROUP = "avactress"
var FACE_API_BASE_END_POINT = "https://westus2.api.cognitive.microsoft.com/face/v1.0/"

//DMMの設定
var DMM_API_ID = PROPERTIES.getProperty('DMM_API_ID')
var DMM_AFFILIATE_ID = PROPERTIES.getProperty('DMM_AFFILIATE_ID')

var reply_token;
var imageUrl;
var id;


//LINEのエンドポイント
function doGet() {
 return HtmlService.createTemplateFromFile("test").evaluate();
}

//LINEからPOSTリクエストを受けたときに起動する
function doPost(e){

/* 処理内容
・LINEから画像バイナリファイルを取得
・バイナリファイルをMicrosoft Azure Face APIに送信
・Face APIから取得したAV女優名をもとに、DMM APIから女優の画像とリンクを取得
・LINEに　
  ・AV女優名
  ・合致度
  ・女優画像
  ・女優URLを返信
・合致しなかった場合、女優追加申請フォームを返す。
*/

 Logger.log("post受けました!")
 if (typeof e === "undefined"){
   /*
    * debug用の処理です
    * imageUrlに、任意のAV女優の画像を挿入しています。
   */
   imageEndPoint = "http://eropalace21.com/wordpress/wp-content/uploads/2016/01/sakuramana_thumb.jpg" //検証用の画像
 } else {
   /*
    * Lineからメッセージが送られたときの処理です
    * URLを取得します
   */
   var json = JSON.parse(e.postData.contents);
   reply_token= json.events[0].replyToken;
   imageEndPoint = json.events[0].message.text;    
 }
   Logger.log("以下のURLから、画像を取得します: " + imageEndPoint)
   console.log(imageEndPoint)
   
   //画像データから、女優名(name)、合致度(confidence)、プロフィール画像(profileImageUrl), 女優の商品画像リスト(itemsInfoUrl)を取得します
   var faceId = detectFaceId(imageEndPoint)
   var personIdAndConfidence = getPersonIdAndConfidence(faceId)
   var personId = personIdAndConfidence["personId"]
   var confidence = personIdAndConfidence["confidence"]
   var name = getActressName(personId)
   var profileImageUrlAndItemsInfoUrl = getProfileImageUrlAndItemsInfoUrl(name)
   var profileImageUrl = profileImageUrlAndItemsInfoUrl["profileImageUrl"]
   var itemsInfoUrl = profileImageUrlAndItemsInfoUrl["itemsInfoUrl"]
   //LineにAV女優名・一致度・女優の画像・女優のAVリストを送信します
   sendLine(name, confidence, profileImageUrl, itemsInfoUrl)
   //logFile.getBody().appendParagraph(Logger.getLog());
}

function detectFaceId(uri){
 end_point = FACE_API_BASE_END_POINT + "detect?recognitionModel=recognition_02"
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
   Logger.log("faceIdの取得に失敗しました")
   Logger.log("エラーメッセージ：" + e)
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
     Logger.log("personIdを取得しました: " + personId )
     Logger.log("coincidenceを取得しました: " + confidence)
     personIdAndConfidence = {
       "personId": personId,
       "confidence": confidence
     }
     return personIdAndConfidence;
   } catch (e){
     Logger.log("personId・confidenceの取得に失敗しました")
     Logger.log(e)
     return e
 }
}
function getActressName(personId){
 /*
  * Face APIから取得したpersonIdから、女優名を取得します
  * @ param
  *  - personId: Face APIで学習したpersonに紐づけられたID
  * @ return
  *  - name{string}: 女優名をフルネームで返します
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
   name = res["name"] //女優名
   Logger.log("女優名を取得しました: " + name)
   return name;
 } catch (e){
   Logger.log("女優名を取得できませんでした")
   Logger.log(e)
   return e
 }
}
function getProfileImageUrlAndItemsInfoUrl(name){
 /*
 * AV女優名(name)から、DMMのAPIをかませて、女優の詳細データを取得します
 @param
   - name{String}: 女優名
 @return
   - actressInfo{array}:AV女優の以下の情報を取得
     - profileImageUrl{String}: 女優のプロフィール画像
     - itemsInfoUrl{String}: 女優が出演しているAVリストのURL
 */
 /* DMM APIから、女優名をもとに、サンプル動画のURLを取得
 */
 
 try {
   var encoded_query = encodeURI(name); //パーセントエンコーディングを行う
   var DMM_end_point = "https://api.dmm.com/affiliate/v3/ActressSearch?"
      + "api_id=" + DMM_API_ID
      + "&affiliate_id=" + DMM_AFFILIATE_ID
      + "&keyword=" + encoded_query
      + "&output=json"
   var response = UrlFetchApp.fetch(DMM_end_point)
   var txt = response.getContentText();
   var json = JSON.parse(txt);
   var actress = json.result.actress[0]
   var profileImageUrl = actress.imageURL.large
   profileImageUrl = profileImageUrl.replace(/^http?\:\/\//i, "https://");
   Logger.log("プロフィール画像を取得しました： " + profileImageUrl)
   var itemsInfoUrl = actress.listURL.digital
   itemsInfoUrl = itemsInfoUrl.replace(/^http?\:\/\//i, "https://");
   Logger.log("女優情報詳細ページURLを取得しました： " + itemsInfoUrl)
   var profileImageUrlAndItemsInfoUrl = {
     "profileImageUrl":profileImageUrl,
     "itemsInfoUrl": itemsInfoUrl
   }
   return profileImageUrlAndItemsInfoUrl;
 } catch (e){
   Logger.log("プロフィール写真と、女優情報詳細ページURLが取得できませんでした")
   return e
 }
}

function sendLine(name, coincidence, actressImageUrl, actressInfoUrl){
 
 Logger.log("name: "+ name)
 Logger.log("coincidence: "+ coincidence)
 Logger.log("actressImageUrl: "+ actressImageUrl)
 Logger.log("actressInfoUrl:" + actressInfoUrl)
 if (typeof coincidence === "undefined"){
   var messages = [{
     "type": "template",
     "altText": "むむ...",
     "template": {
       "type": "buttons",
       "thumbnailImageUrl": 'https://rr.img.naver.jp/mig?src=http%3A%2F%2Fimgcc.naver.jp%2Fkaze%2Fmission%2FUSER%2F20160319%2F73%2F7666243%2F444%2F400x400xbb8969833802de4d23d8397c.jpg',
       "title": "お前のスケベな願望に答えられなかった。",
       "text": "すまんが、好みの女優さんは見つからなかったよ。まだまだデータが必要ということか...",
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
   var messages = [{
     "type": "template",
     "altText": "おすすめの女優さんが見つかったぞ！！",
     "template": {
       "type": "buttons",
       "thumbnailImageUrl": actressImageUrl,
       "title": name,
       "text": "一致度は" + (Math.round(coincidence * 100)) + "%じゃ",
       "actions": [
       {
       "type": "uri",
       "label": "動画一覧ページに移動！",
       "uri": actressInfoUrl
     }
     ]
   }
   }];
  }
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
   Logger.log("LINEへのメッセージ送信に失敗しました")
   Logger.log(e)
 }
}