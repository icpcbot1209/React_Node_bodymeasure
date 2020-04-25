import React, { useState } from "react";
import PropTypes from "prop-types";

import FileInput from "./FileInput";

import BackFileInput from "../test/BackFileInput";

const InputPanel = ({ propStartCalc, propChangeIsCm }) => {
  const [uniqueName, setUniqueName] = useState("");
  const [isCm, setIsCm] = useState(true);
  const [isKg, setIsKg] = useState(true);
  const [heightCm, setHeightCm] = useState("");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [weightLb, setWeightLb] = useState("");
  const [isMale, setIsMale] = useState(true);
  const [fileFront, setFileFront] = useState();
  const [fileSide, setFileSide] = useState();

  const onChangeGender = (e) => {
    setIsMale(e.target.value === "male");
  };

  const onClickSubmit = (e) => {
    e.preventDefault();
    let weight = 0;
    if (isKg) weight = Number(weightKg);
    else weight = Number(weightLb) * 0.453592;
    let height = 0;
    if (isCm) height = Number(heightCm);
    else height = (Number(heightFt) * 12 + Number(heightIn)) * 2.54;

    if (isValid(uniqueName, isMale, height, weight) && fileFront && fileSide)
      propStartCalc(fileFront, fileSide, uniqueName, isMale, height, weight);
    else alert("Invalid Input");
  };

  const isValid = (uniqueName, isMale, height, weight) => {
    return true;
  };

  return (
    <div>
      <div className="content-block">
        <div className="content-block-header">
          <h3>Enter User Data</h3>
        </div>
        <div className="content-block-body">
          <form>
            <div className="form-group row">
              <label htmlFor="uniquename" className="col-sm-3 col-form-label">
                Name:
              </label>
              <div className="col-sm-9">
                <input
                  type="text"
                  className="form-control"
                  placeholder=""
                  autoComplete="off"
                  value={uniqueName}
                  onChange={(e) => setUniqueName(e.target.value)}
                />
              </div>
            </div>
            <div className="form-group row">
              <label htmlFor="height" className="col-sm-3 col-form-label">
                Height:
              </label>
              <div className="col-sm-9">
                <div className="row">
                  <div className="col-9">
                    <input
                      type="number"
                      className="form-control height-input__cm "
                      style={{ display: isCm ? "" : "none" }}
                      placeholder=""
                      value={heightCm}
                      onChange={(e) => setHeightCm(e.target.value)}
                    />
                    <div
                      className="height-input__in"
                      style={{ display: isCm ? "none" : "" }}
                    >
                      <input
                        type="number"
                        className="form-control"
                        placeholder=""
                        value={heightFt}
                        onChange={(e) => setHeightFt(e.target.value)}
                      />
                      <input
                        type="number"
                        className="form-control "
                        placeholder=""
                        value={heightIn}
                        onChange={(e) => setHeightIn(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="col-3 pr-2 pl-2 ">
                    <span className="height-input__switch">
                      <button
                        type="button"
                        tabIndex="-1"
                        className={
                          "height-input__btn height-input__btn--cm" +
                          (isCm
                            ? " active js-active-check"
                            : " js-active-check")
                        }
                        onClick={(e) => {
                          setIsCm(true);
                          propChangeIsCm(true);
                        }}
                      >
                        cm
                      </button>
                      <button
                        type="button"
                        tabIndex="-1"
                        className={
                          "height-input__btn height-input__btn--in" +
                          (!isCm
                            ? " active js-active-check"
                            : " js-active-check")
                        }
                        onClick={(e) => {
                          setIsCm(false);
                          propChangeIsCm(false);
                        }}
                      >
                        in
                      </button>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-group row">
              <label htmlFor="height" className="col-sm-3 col-form-label">
                Weight:
              </label>
              <div className="col-sm-9">
                <div className="row">
                  <div className="col-9">
                    <input
                      type="number"
                      style={{ display: isKg ? "" : "none" }}
                      className="form-control height-input__cm "
                      placeholder=""
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                    />
                    <input
                      type="number"
                      style={{ display: !isKg ? "" : "none" }}
                      className="form-control height-input__cm "
                      placeholder=""
                      value={weightLb}
                      onChange={(e) => setWeightLb(e.target.value)}
                    />
                  </div>
                  <div className="col-3 pr-2 pl-2 ">
                    <span className="height-input__switch">
                      <button
                        className={
                          "height-input__btn height-input__btn--kg" +
                          (isKg ? " active" : "")
                        }
                        type="button"
                        onClick={(e) => setIsKg(true)}
                      >
                        kg
                      </button>
                      <button
                        className={
                          "height-input__btn height-input__btn--lb" +
                          (!isKg ? " active" : "")
                        }
                        type="button"
                        onClick={(e) => setIsKg(false)}
                      >
                        lb
                      </button>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <fieldset className="form-group">
              <div className="row">
                <legend className="col-form-label col-sm-3 pt-0">
                  Gender:
                </legend>
                <div className="col-sm-9">
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input select-gender"
                      type="radio"
                      name="gender"
                      id="female"
                      value="female"
                      checked={!isMale}
                      onChange={onChangeGender}
                    />
                    <label className="form-check-label" htmlFor="female">
                      Female
                    </label>
                  </div>
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input select-gender"
                      type="radio"
                      name="gender"
                      id="male"
                      value="male"
                      checked={isMale}
                      onChange={onChangeGender}
                    />
                    <label className="form-check-label" htmlFor="male">
                      Male
                    </label>
                  </div>
                </div>
              </div>
            </fieldset>
            {/* <canvas id="canvas" style={{ border: "1px solid #d3d3d3" }} /> */}

            <div className="form-group row mt-4">
              <FileInput
                isMale={isMale}
                isFront={true}
                propChangeFile={(file) => setFileFront(file)}
              />
              {/* <BackFileInput isMale={isMale} /> */}

              <FileInput
                isMale={isMale}
                isFront={false}
                propChangeFile={(file) => setFileSide(file)}
              />
            </div>
          </form>
        </div>
      </div>

      <div className="content--continue-btn">
        <button
          className="button button--purple button--lg body-model__btn"
          onClick={onClickSubmit}
        >
          <span className="text">Calculate</span>
        </button>
      </div>
    </div>
  );
};

InputPanel.propTypes = {
  propStartCalc: PropTypes.func.isRequired,
  propChangeIsCm: PropTypes.func.isRequired,
};

export default InputPanel;
