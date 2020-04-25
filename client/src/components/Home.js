import React, { useState } from "react";
import axios from "axios";
import InputPanel from "./InputPanel";
import ResultPanel from "./ResultPanel";

import Message from "./Message";

const Home = props => {
  const [isCm, setIsCm] = useState(true);
  const [calcResult, setCalcResult] = useState({});
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState("");

  const handleChangeIsCm = _isCm => setIsCm(_isCm);

  const handleStartCalc = async (
    fileFront,
    fileSide,
    uniqueName,
    isMale,
    height,
    weight
  ) => {
    const formData = new FormData();
    formData.append("frontFile", fileFront);
    formData.append("sideFile", fileSide);
    formData.append("uniqueName", uniqueName);
    formData.append("isMale", isMale);
    formData.append("height", height);
    formData.append("weight", weight);

    const config = { headers: { "content-type": "multipart/form-data" } };

    setIsBusy(true);

    try {
      const resp = await axios.post("/get-body-measure", formData, config);
      let result = resp.data.data;
      console.log(result);
      setCalcResult(result);
    } catch (err) {
      if (!err.response) {
      } else if (err.response.status === 500) {
        setMessage("There was a problem with the server");
        setTimeout(() => {
          setMessage("");
        }, 3000);
      } else {
        setMessage(err.response.data.msg);
        setTimeout(() => {
          setMessage("");
        }, 3000);
      }
    }

    setIsBusy(false);
  };

  return (
    <div className="main-wrapper">
      <div className="overlay" style={{ display: isBusy ? "" : "none" }}>
        <div className="loader w3-display-middle"></div>
      </div>
      <div className="container-fluid">
        <div className="main-page-title row">
          <h1 className="main-content__header-title col-md-9">
            Manual upload of the customer1
          </h1>
          <div className="col-md-3">
            <Message msg={message} />
          </div>
        </div>

        <div className="main-content-wrapper content-section row">
          <div className="col-md-5">
            <InputPanel
              propStartCalc={handleStartCalc}
              propChangeIsCm={handleChangeIsCm}
            />
          </div>

          <div className="col-md-7">
            <ResultPanel calcResult={calcResult} isCm={isCm} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
