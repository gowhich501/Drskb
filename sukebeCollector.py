from selenium import webdriver
import pandas

"""***************************************
もろもろの設定
***************************************"""
browser = webdriver.Chrome("C:/Goichi/App/chromedriver/chromedriver.exe")
df = pandas.read_csv('default.csv', index_col=0) #女優名・女優の画像URLが列に入っている
url = "http://wav.tv/actresses/" #エロサイトの女優リストのページ

"""******************************
CSS SELECTORの設定
******************************"""

PAGER_NEXT = "a.m-pagination--next.is-last.step" #次へボタン
POSTS = "div.m-actress-wrap"
ACTRESS_NAME = ".m-actress--title" #女優名
IMAGE = ".m-actress--thumbnail-img img" #サムネイル画像のURL、srcで画像ファイルを取得できる

"""***************************************
実行部分
***************************************"""

browser.get(url)

while True: #continue until getting the last page

   #5-1

   if len(browser.find_elements_by_css_selector(PAGER_NEXT)) > 0:
       print("Starting to get posts...")
       posts = browser.find_elements_by_css_selector(POSTS) #ページ内のタイトル複数
       print (len(posts))
       for post in posts:
           try:
               name = post.find_element_by_css_selector(ACTRESS_NAME).text
               print(name)
               thumnailURL = post.find_element_by_css_selector(IMAGE).get_attribute("src")
               print(thumnailURL)
               se = pandas.Series([name,thumnailURL],["name", "image"])    
               df = df.append(se, ignore_index=True)
           except Exception as e:
               print(e)

       btn = browser.find_element_by_css_selector(PAGER_NEXT).get_attribute("href")
       print("next url:{}".format(btn))
       browser.get(btn)
       print("Moving to next page......")
   else:
       print("no pager exist anymore")
       break #6
print("Finished Scraping. Writing CSV.......")
df.to_csv("output.csv")
print("DONE")