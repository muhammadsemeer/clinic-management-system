var socket = io();
var notification = "notify" + id;
var noificationContainer = document.querySelector(".notfication-container");
socket.on(notification, (appointment) => {
  noificationContainer.innerHTML += `
    <div class="notificaton" onclick="location.href = '/bookings'">
    <div class="notification-heading">
     ${appointment.user.name}
    </div>
    <div class="notification-text">
      New Booking on ${appointment.date} at ${appointment.timeslot}
    </div>
    <button onclick="this.parentNode.remove()">Close</button>
  </div>
    `;
});
