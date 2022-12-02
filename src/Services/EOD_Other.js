export const EOD_Other = (project, type, notes, includeHeader=false, borderTop=false) => `
${borderTop ? `<table style="font-family:'Open Sans',sans-serif;margin-top:10px;margin-bottom:5px" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                        <tbody>
                          <tr>
                            <td style="overflow-wrap:break-word;word-break:break-word;padding:0px 10px 10px;font-family:'Open Sans',sans-serif;" align="left">

                              <table height="0px" align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;border-top: 1px solid gray;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
                                <tbody>
                                  <tr style="vertical-align: top">
                                    <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top;font-size: 0px;line-height: 0px;mso-line-height-rule: exactly;-ms-text-size-adjust: 100%;-webkit-text-size-adjust: 100%">
                                      <span>&#160;</span>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>

                            </td>
                          </tr>
                        </tbody>
                      </table>` : ''}

<table id="u_body" style="border-collapse: collapse;table-layout: fixed;border-spacing: 0;mso-table-lspace: 0pt;mso-table-rspace: 0pt;vertical-align: top;min-width: 320px;Margin: 0 auto;background-color: #ffffff;width:100%" cellpadding="0" cellspacing="0">
<tbody>
  <tr style="vertical-align: top">
    <td style="word-break: break-word;border-collapse: collapse !important;vertical-align: top">
      <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="background-color: #ffffff;"><![endif]-->


      <div class="u-row-container" style="padding: 0px;background-color: transparent">
        <div class="u-row" style="Margin: 0 auto;min-width: 320px;max-width: 500px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;">
          <div style="border-collapse: collapse;display: table;width: 100%;height: 100%;background-color: transparent;">
            <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding: 0px;background-color: transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:500px;"><tr style="background-color: transparent;"><![endif]-->

            <!--[if (mso)|(IE)]><td align="center" width="249" style="width: 249px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
            <div class="u-col u-col-49p8" style="max-width: 320px;min-width: 249px;display: table-cell;vertical-align: top;">
              <div style="height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
                <!--[if (!mso)&(!IE)]><!-->
                <div style="height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
                  <!--<![endif]-->

                  <table style="font-family:'Open Sans',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                    <tbody>
                      <tr>
                        <td style="overflow-wrap:break-word;word-break:break-word;padding:5px 10px 0px 0px;font-family:'Open Sans',sans-serif;" align="left">

                          <h3 style="margin: 0px; line-height: 140%; text-align: right; word-wrap: break-word; font-weight: normal; font-size: 17px;">
                            <strong>${includeHeader ? project : ''}</strong>
                          </h3>

                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <table style="font-family:'Open Sans',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                    <tbody>
                      <tr>
                        <td style="overflow-wrap:break-word;word-break:break-word;padding:0px 10px 10px;font-family:'Open Sans',sans-serif;" align="left">

                          <h4 style="margin: 0px; color: #000000; line-height: 140%; text-align: right; word-wrap: break-word; font-weight: normal; font-size: 14px;">
                            ${type + 's'}
                          </h4>

                        </td>
                      </tr>
                    </tbody>
                  </table>
                  
                  <table style="font-family:'Open Sans',sans-serif;" cellpadding="0" cellspacing="0" width="100%" border="0">
                    <tbody>
                      <tr>
                        <td style="overflow-wrap:break-word;word-break:break-word;padding:10px;font-family:'Open Sans',sans-serif;" align="left">

                          <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="padding-right: 0px;padding-left: 0px;" align="right">


                              </td>
                            </tr>
                          </table>

                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <!--[if (!mso)&(!IE)]><!-->
                </div>
                <!--<![endif]-->
              </div>
            </div>
            <!--[if (mso)|(IE)]></td><![endif]-->
            <!--[if (mso)|(IE)]><td align="center" width="251" style="width: 251px;padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;" valign="top"><![endif]-->
            <div class="u-col u-col-50p2" style="max-width: 320px;min-width: 251px;display: table-cell;vertical-align: top;">
              <div style="height: 100%;width: 100% !important;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px${!includeHeader ? ';border-top: solid 1px gray;padding-top:10px;margin-top:5px' : ''}">
                <!--[if (!mso)&(!IE)]><!-->
                <div style="height: 100%; padding: 0px;border-top: 0px solid transparent;border-left: 0px solid transparent;border-right: 0px solid transparent;border-bottom: 0px solid transparent;border-radius: 0px;-webkit-border-radius: 0px; -moz-border-radius: 0px;">
                  <!--<![endif]-->

                  <table style="font-family:'Open Sans',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                    <tbody>
                      <tr>
                        <td style="overflow-wrap:break-word;word-break:break-word;padding:5px 10px 0px;font-family:'Open Sans',sans-serif;" align="left">

                          <h3 style="margin: 0px; line-height: 140%; text-align: left; word-wrap: break-word; font-weight: normal; font-size: 16px;">
                          <strong></strong>
                          </h3>

                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <table style="font-family:'Open Sans',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                    <tbody>
                      <tr>
                        <td style="overflow-wrap:break-word;word-break:break-word;padding:0px 10px 10px;font-family:'Open Sans',sans-serif;" align="left">

                          <div style="line-height: 140%; text-align: left; word-wrap: break-word;">
                            
                              <p style="font-size: 14px; line-height: 140%;"><span style="color: #000000; font-size: 14px; line-height: 19.6px;"><strong><span style="font-size: 14px; line-height: 19.6px;"><span style="line-height: 19.6px; font-size: 14px;"></span></span>
                                </strong>
                                </span>
                              </p>
                          </div>

                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <table style="font-family:'Open Sans',sans-serif;" role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                    <tbody>
                      <tr>
                        <td style="overflow-wrap:break-word;word-break:break-word;padding:0px 0px 10px 10px;font-family:'Open Sans',sans-serif;" align="left">

                          <div style="line-height: 140%; text-align: left; word-wrap: break-word;">
                            <p style="font-size: 14px; line-height: 140%;"><span style="font-size: 12px; line-height: 16.8px;">${notes ? notes : '<span style="font-style:italic">No Notes Provided...</span>'}</span></p>
                          </div>

                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <!--[if (!mso)&(!IE)]><!-->
                </div>
                <!--<![endif]-->
              </div>
            </div>
            <!--[if (mso)|(IE)]></td><![endif]-->
            <!--[if (mso)|(IE)]></tr></table></td></tr></table><![endif]-->
          </div>
        </div>
      </div>


      <!--[if (mso)|(IE)]></td></tr></table><![endif]-->
    </td>
  </tr>
</tbody>
</table>`