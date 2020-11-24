import requests
import json
import logging
import pandas as pd

# 
BASE_URL = "https://westus2.api.cognitive.microsoft.com/face/v1.0/"
SUBSCRIPTION_KEY  = "0cd899ff649740308319ae1d779367a1"
GROUP_NAME = "idle"

def makeGroup():
   end_point = BASE_URL + "persongroups/" + GROUP_NAME
   payload = {
       "name": GROUP_NAME
   }
   headers = {
       "Ocp-Apim-Subscription-Key" :SUBSCRIPTION_KEY
   }
   r = requests.put(
       end_point,
       headers = headers,
       json = payload
   )
   print (r.text)

def makePerson(name,profile):
   end_point = BASE_URL + "persongroups/" + GROUP_NAME + "/persons"
   headers = {
       "Ocp-Apim-Subscription-Key" :SUBSCRIPTION_KEY
   }
   payload = {
       "name": name,
       "userData": profile
   }
   r = requests.post(
       end_point,
       headers = headers,
       json = payload
   )
   try:
      personId = r.json()["personId"]
   except Exception as e:
      personId = None
      print(r.json()["error"])
   return personId

def addFaceToPerson(personId, imageUrl):

  if personId != None:
      end_point = BASE_URL + "persongroups/" + GROUP_NAME + "/persons/" + personId  + "/persistedFaces"
      print(end_point)
      headers = {
          "Ocp-Apim-Subscription-Key" :SUBSCRIPTION_KEY
      }
      payload = {
          "url": imageUrl
      }
      r = requests.post(
          end_point,
          headers = headers,
          json = payload
      )
      try:
          print("Successfuly added face to person")
          persistedFaceId = r.json()
      except Exception as e:
          print("Failed to add a face to person")
          print(e)
          persistedFaceId = None
      return persistedFaceId
  else:
      print("personId is not set.")
      return None

def trainGroup(groupId):
  end_point = BASE_URL + "persongroups/" + GROUP_NAME + "/train"
  headers = {
      "Ocp-Apim-Subscription-Key" :SUBSCRIPTION_KEY
  }
  r = requests.post(
      end_point,
      headers = headers,
  )
  print(r.text)

def detectFace(imageUrl):
  """
  学習済みのpersonGroupの中で、送信する画像のURLから似ている候補(candidates)を
  取得できます。
  """
  end_point = BASE_URL + "detect?recognitionModel=recognition_03"
  headers = {
      "Ocp-Apim-Subscription-Key" :SUBSCRIPTION_KEY
  }
  payload = {
      "url": imageUrl
  }
  r = requests.post(
      end_point,
      json = payload,
      headers = headers
  )
  try:
      faceId = r.json()[0]["faceId"]
      print ("faceId Found:{}".format(faceId))
      return r.json()[0]
  except Exception as e:
      print("faceId not found:{}".format(e))
      return None

def identifyPerson(faceId):
  end_point = BASE_URL + "identify"
  headers = {
      "Ocp-Apim-Subscription-Key" :SUBSCRIPTION_KEY
  }
  faceIds = [faceId]
  payload = {
      "faceIds" :faceIds,
      "personGroupId" :GROUP_NAME,
      #"maxNumOfCandidatesReturned" :maxNumOfCandidatesReturned
  }
  r = requests.post(
      end_point,
      json = payload,
      headers = headers
  )
  print(r.json())

  return r.json()[0]

def getPersonInfoByPersonId(personId):
  end_point = BASE_URL + "persongroups/"+ GROUP_NAME +"/persons/" + personId
  headers = {
    "Ocp-Apim-Subscription-Key" :SUBSCRIPTION_KEY
  }
  r = requests.get(
    end_point,
    headers = headers
  )
  print(r.json())
  return r.json()

if __name__ == '__main__':
    #画像から、personを特定するときのサンプルコード
  image = "https://s.akb48.co.jp/sousenkyo2017/70004.jpg"
  faceId = detectFace(image)
  person = identifyPerson(faceId["faceId"])
  if person["candidates"]: #学習データに候補があれば
    personId = person["candidates"][0]["personId"]
    print("personId " + personId)
    personInfo = getPersonInfoByPersonId(personId)
    print(personInfo["name"])
    print(personInfo["userData"])
  else:
    print ("No candidates found")

"""
  df = pd.read_csv("idleList.csv",index_col=0)
  df2 = pd.read_csv("learning-default.csv", index_col=0)
  for i, row in df.iterrows(): # name,image,profile
      name = row["name"]
      image = row["image"]
      profile = row["profile"]
      #personを登録し、personIdを返す
      personId = makePerson(name, profile)
      #personIdをもとに、そのpersonにスクレイピングした画像とプロフィールのURLを追加する
      addFaceToPerson(personId, image)
      se = pd.Series([name,image,profile,personId],["name", "image", "profile","personId"])
      df2 = df2.append(se,ignore_index=True)
      print (df2)
"""




