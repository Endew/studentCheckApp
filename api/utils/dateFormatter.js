const formatDate = (dateStr) => {
    const monthNames = [
        "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
        "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];

    const date = new Date(dateStr);
    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear() + 543;

    return `${day} ${month} ${year}`;
};

const formatToISODate = (thaiDate) => {
    const monthNames = [
        "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
        "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];

    const [dayStr, monthStr, yearStr] = thaiDate.split(' ');
    const day = String(dayStr).padStart(2, '0');
    const month = String(monthNames.indexOf(monthStr) + 1).padStart(2, '0');
    const year = String(parseInt(yearStr) - 543);

    return `${year}-${month}-${day}`;
};

module.exports = { formatDate, formatToISODate };