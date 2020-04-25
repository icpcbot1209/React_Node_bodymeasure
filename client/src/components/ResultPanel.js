import React from "react";
import PropTypes from "prop-types";

let ResultPanel = ({ isCm, calcResult }) => {
  const labelmaps = [
    { label: "Neck Size", field: "Neck_Round_Length" },
    { label: "Bicep Size", field: "Arm_Round_Length" },
    { label: "Forearm Size", field: "forearm_Round_Length" },
    { label: "Waist", field: "Waist_Round_Length" },
    { label: "Hip Size", field: "Hip_Round_Length" },
    { label: "Thigh Size", field: "thigh_Round_Length" },
    { label: "Calf Size", field: "calf_Round_Length" }
  ];
  return (
    <div className="content-block">
      <div className="content-block-header">
        <h3 className="js-measurement-unit">
          Measurements ({isCm ? "mm" : "mm"})
        </h3>
      </div>
      <div className="content-block-body measurenments-details">
        <div className="tab-content" id="myTabContent">
          <div
            className="tab-pane fade show active"
            id="home"
            role="tabpanel"
            aria-labelledby="home-tab"
          >
            <div className="row">
              <div className="col-12">
                <table className="body-model__params-col">
                  <tbody>
                    {labelmaps.map((labelm, i) => {
                      return (
                        <tr key={i} className="body-model__param">
                          <td>
                            <span className="text">{labelm.label}:</span>
                          </td>
                          <td>
                            <div
                              className="input body-model__param-input"
                              style={{ paddingTop: "5px" }}
                            >
                              {calcResult[labelm.field] === null
                                ? ""
                                : calcResult[labelm.field]}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/*                 
                <div className="col-6">
                    <img className= "w3-border w3-padding" src={url0} style={{width:"100%"}} alt=""/>
                    <img className= "w3-border w3-padding" src={url1} style={{width:"100%"}} alt=""/>
                </div> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

ResultPanel.propTypes = {
  isCm: PropTypes.bool.isRequired,
  calcResult: PropTypes.object.isRequired
};

export default ResultPanel;
