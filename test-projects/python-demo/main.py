import requests
from flask import Flask

# This file uses requests and flask
# So they should be marked as "used" by the analyzer

app = Flask(__name__)

@app.route('/')
def hello():
    return 'Demo app uses requests and flask'

if __name__ == '__main__':
    print('Python demo with requests and flask')
