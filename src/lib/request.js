const request = async (url, obj) => {
    const res = await fetch(url + "?" + new URLSearchParams(obj));
    return await res.json();
};
export default request;
