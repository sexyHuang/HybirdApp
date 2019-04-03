/*
 * @Author: Sexy
 * @LastEditors: Sexy
 * @Description: file content
 * @Date: 2019-04-03 11:00:58
 * @LastEditTime: 2019-04-03 14:22:38
 * @Description: HybirdApp类
 */

//回调函数栈
const CALLBACK_STORE = {};

//回调主方法名
const CALLBACK_HANDLER_NAME = '_runCallBack';

const INJECT_OBJECT_NAME = '_injectObject';

//错误码
const ERR_CODES = [
  {
    errorCode: -1,
    errorMsg: '请在客户端内使用该功能'
  },
  {
    errorCode: -2,
    errorMsg: '方法不存在'
  }
];

/**
 * 自增id
 * @generator
 */
function* getID() {
  let id = 0;
  while (true) {
    yield id++;
  }
}

/**
 * 柯里化
 * @param {function} fn - 目标函数
 * @param {Array} arr - 初始化参数
 * @return {any}
 */
const curry = (fn, arr = []) => (...args) =>
  (args => (fn.length === args.length ? fn(...args) : curry(fn, args)))([
    ...arr,
    ...args
  ]);

/**
 * HybirdApp
 */
class HybirdAppApi {
  /**
   * @constructor
   * @param {Object} option - option
   * @param {String} option.injectObjectName - 注入对象名
   * @param {String} option.callbackHandlerName - 回调处理者名
   * @param {String} option.AppName - 客户端应用名
   */
  constructor({
    injectObjectName = INJECT_OBJECT_NAME,
    callbackHandlerName = CALLBACK_HANDLER_NAME,
    AppName = ''
  } = {}) {
    this._init({
      injectObjectName,
      callbackHandlerName,
      AppName
    });
  }

  /**
   * 初始化方法
   * @param {Object} option - option
   * @param {String} option.injectObjectName - 注入对象名
   * @param {String} option.callbackHandlerName - 回调处理者名
   * @param {String} option.AppName - 客户端应用名
   */
  _init({ injectObjectName, callbackHandlerName, AppName }) {
    if (FbAppApi.isInit) return (this.callbacks = FbAppApi.isInit);
    const UA = navigator.userAgent;
    const idIterator = getID();
    this.isAndroid = /android|adr/gi.test(UA);
    this.isIos = /iphone|ipod|ipad/gi.test(UA) && !this.isAndroid;
    this.isApp =
      (this.isAndroid && window[injectObjectName]) ||
      (this.isIos &&
        window.webkit &&
        window.webkit.messageHandlers[injectObjectName]);
    this._injectObjectName = injectObjectName;
    this._AppName = AppName;
    this._getIncreaseID = () => idIterator.next().value;
    window[callbackHandlerName] = (callbackName, datas = '') => {
      let _data;
      try {
        _data = JSON.parse(datas);
      } catch (e) {
        _data = datas;
      }
      CALLBACK_STORE[callbackName] && CALLBACK_STORE[callbackName](_data);
    };
    FbAppApi.isInit = this.callbacks = window[callbackHandlerName];
  }

  /**
   * 删除回调方法
   * @param {String} callbackName - 回调名
   */
  _removeCallBack(callbackName) {
    delete CALLBACK_STORE[callbackName];
  }

  /**
   * 设置回调方法
   * @param {String} callbackName - 回调名
   * @return {Boolean} - 成功标志
   */
  _setCallBack(callbackName, func) {
    if (Object.prototype.toString.call(func) !== '[object Function]')
      return false;
    //const CALLBACK_NAME = `${actionName}_${this._getIncreaseID()}`;
    CALLBACK_STORE[callbackName] = func;
    return true;
  }

  /**
   * 调用方法的方法
   * @param {String} actionName - 方法名
   * @param {any} data - 方法参数
   * @return {Promise}
   */
  _runApi(actionName, data) {
    const {
      _injectObjectName,
      isAndroid,
      isIos,
      isApp,
      _setCallBack,
      _getIncreaseID,
      _removeCallBack
    } = this;
    const FULL_ACTION_NAME = `${_injectObjectName}.${actionName}`;
    return new Promise((resolve, reject) => {
      if (!isApp) {
        reject(ERR_CODES[0]);
      }
      if (
        (isAndroid && !window.phoneListener[actionName]) ||
        (isIos && !window.webkit.messageHandlers[FULL_ACTION_NAME])
      )
        reject(ERR_CODES[1]);
      const SUCCESS_NAME = `${actionName}_${_getIncreaseID()}`;
      const FAIL_NAME = `${actionName}_${_getIncreaseID()}`;
      const request = {
        SUCCESS_NAME,
        FAIL_NAME
      };
      request.body = data;
      const _dataStr = JSON.stringify(request);

      _setCallBack(SUCCESS_NAME, res => {
        _removeCallBack(SUCCESS_NAME);
        resolve(res);
      });
      _setCallBack(FAIL_NAME, err => {
        _removeCallBack(FAIL_NAME);
        reject(err);
      });
      isAndroid
        ? window[_injectObjectName][actionName](_dataStr)
        : window.webkit.messageHandlers[FULL_ACTION_NAME].postMessage(_dataStr);
    });
  }

  /**
   *  _runApi的柯里化
   */
  runApi(...args) {
    return curry(this._runApi, args);
  }
}

export default HybirdAppApi;
