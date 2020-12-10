module.exports.createSlots = (slotConfig) => {
  const {
    configSlotHours,
    configSlotMinutes,
    configSlotPreparation,
    timeArr,
  } = slotConfig;

  let defaultDate = new Date().toISOString().substring(0, 10);
  let slotsArray = [];
  let _timeArrStartTime,
    _timeArrEndTime,
    _tempSlotStartTime,
    _endSlot,
    _startSlot;

  for (var i = 0; i < timeArr.length; i++) {
    _timeArrStartTime = new Date(
      defaultDate + " " + timeArr[i].startTime
    ).getTime();
    _timeArrEndTime = new Date(
      defaultDate + " " + timeArr[i].endTime
    ).getTime();
    _tempSlotStartTime = _timeArrStartTime;

    // Loop around till _tempSlotStartTime is less end time from timeArr
    while (
      new Date(_tempSlotStartTime).getTime() <
      new Date(_timeArrEndTime).getTime()
    ) {
      _endSlot = new Date(_tempSlotStartTime);
      _startSlot = new Date(_tempSlotStartTime);
      //Adding minutes and hours from config to create slot and overiding the value of _tempSlotStartTime
      _tempSlotStartTime = _endSlot.setHours(
        parseInt(_endSlot.getHours()) + parseInt(configSlotHours)
      );
      _tempSlotStartTime = _endSlot.setMinutes(
        parseInt(_endSlot.getMinutes()) + parseInt(configSlotMinutes)
      );

      // Check _tempSlotStartTime is less than end time after adding minutes and hours, if true push into slotsArr
      if (
        new Date(_tempSlotStartTime).getTime() <=
        new Date(_timeArrEndTime).getTime()
      ) {
        // DateTime object is converted to time with the help of javascript functions
        // If you want 24 hour format you can pass hour12 false
        slotsArray.push({
          timeSlotStart: new Date(_startSlot).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "numeric",
            hour12: true,
          }),
          timeSlotEnd: _endSlot.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "numeric",
            hour12: true,
          }),
        });
      }

      //preparation time is added in last to maintain the break period
      _tempSlotStartTime = _endSlot.setMinutes(
        _endSlot.getMinutes() + parseInt(configSlotPreparation)
      );
    }
  }
  return slotsArray;
}
