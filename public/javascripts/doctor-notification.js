var socket = io();
var notification = "notify" + id;
var noificationContainer = document.querySelector(".notfication-container");
socket.on(notification, (appointment) => {
  noificationContainer.innerHTML += `
    <div class="notificaton">
    <div class="notification-heading" onclick="location.href = '/bookings'">
     ${appointment.user.name}
    </div>
    <div class="notification-text" onclick="location.href = '/bookings'">
      New Booking on ${appointment.date} at ${appointment.timeslot}
    </div>
    <button onclick="this.parentNode.remove()">Close</button>
  </div>
    `;
});
