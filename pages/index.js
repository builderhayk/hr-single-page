import React, {useEffect, useState} from 'react';
import axios from 'axios';
import {Table, Input, DatePicker, TimePicker, Button} from 'antd';
import moment from 'moment';
import converter, {convertArrayToCSV} from "convert-array-to-csv"
import "./style.css"

const DownloadFile = (data, fileName) => {
    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};

export default function Home() {
    const [data, setData] = useState([]);
    const [calculatedData,setCalculatedData]=useState([])
    // console.log(window ==="undefined" ? "dd" : window.location.href)
    const handleFileLoad = async (file) => {
        const fd = new FormData();
        fd.append("file", file);
        const result = await axios.post(`/files/upload`, fd);
        if (result.data?.result.length) {
            setData([...result.data.result])
        }
    };

    const saveData = async () => {
        if (data.length) {
            const result = await axios.post(`/files/calculate`, {data: [...data]});
            setCalculatedData(result.data.result)
        }
    }

    function add(index) {
        const newData = {
            ...data[index],
            attendanceCheckPoint: data[index].attendanceCheckPoint === "Exit_Exit_Entrance Card Reader1" ? "Entrance_Entrance_Entrance Card Reader1" :"Exit_Exit_Entrance Card Reader1",
            withTimeInput: true,
            dateInputValue: moment().format("YYYY-MM-DD"),
            timeInputValue: moment().format("HH:mm:ss"),
        };
        setData([...data.slice(0, index + 1), newData, ...data.slice(index + 1)]);
    }
    
    async function sendCalculatedData (){
    const  csv = convertArrayToCSV(calculatedData)
        console.log(csv)
        DownloadFile(csv, "my.csv")
        
    }

    function onDatePickerChange(date, dateString, index) {
        console.log(data[index], 'data[index]');
        const newData = {
            ...data[index],
            dateInputValue: date && moment(date) || moment().format("YYYY-MM-DD"),
            withTimeInput: true
        };
        let dataCopy = [...data];
        dataCopy[index] = newData
        setData([...dataCopy]);
    }

    function onTimePickerChange(time, timeString, index) {
        const newData = {
            ...data[index],
            timeInputValue: !!time ? timeString : moment().format("00:00:00","HH:mm:ss"),
            withTimeInput: true
        };
        let dataCopy = [...data];
        dataCopy[index] = newData
        setData([...dataCopy]);
    }
    
    const calculatedDataColumns =[
        {
            title:"id",
            dataIndex:"id",
            key:"id"
        },
        {
        title: "name",
            dataIndex: "name",
        key: "name",
        },
        {
            title: "totalWorkingTime",
            dataIndex: "totalWorkingTime",
            key: "totalWorkingTime"
        }
    ]
    
    const columns = [
        {
            title: '#',
            dataIndex: 'id',
            key: 'id',
            render: (_,__, i) => {
              return <span>{i}</span>
            }
        },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Data Source',
            dataIndex: 'dataSource',
            key: 'dataSource',
        },
        {
            title: 'AttendanceCheck Point',
            dataIndex: 'attendanceCheckPoint',
            key: 'attendanceCheckPoint',
        },
        {
            title: 'Department',
            dataIndex: 'department',
            key: 'department',
        },
        {
            title: 'Time',
            dataIndex: 'time',
            key: 'time',
            render: (_, rowData, index) => {
                if (rowData.withTimeInput) {
                    return (
                        <div key={index}>
                            <DatePicker
                                onChange={(date, dateString) => onDatePickerChange(date, dateString, index)}
                                value={moment(rowData.dateInputValue, 'YYYY-MM-DD')}
                            />
                            <TimePicker
                                onChange={(time, timeString) => onTimePickerChange(time, timeString, index)}
                                value={moment(rowData.timeInputValue, 'HH:mm:ss')}
                            />
                        </div>
                    )
                } else {
                    return <span key={index}>{_}</span>
                }
            }
        },
        {

            title: 'Actions',
            dataIndex: 'actions',
            key: 'actions',
            render: (_, idx, i) => {
                if (data[i]
                    &&
                    data[i].id
                    && data[i + 1]
                    && data[i - 1]
                    && data[i + 1].id
                    && data[i].attendanceCheckPoint && data[i + 1].attendanceCheckPoint) {
                    if ((data[i].id === data[i + 1].id && data[i].attendanceCheckPoint === data[i + 1].attendanceCheckPoint
                         && !data[i + 1].withTimeInput && !data[i].withTimeInput) || ((data[i].id !== data[i + 1].id && data[i].attendanceCheckPoint !== 'Exit_Exit_Entrance Card Reader1') ||
                        (data[i].id !== data[i - 1].id && data[i].attendanceCheckPoint !== 'Entrance_Entrance_Entrance Card Reader1')) ) {
                        return <Button onClick={() => add(i)}>+</Button>
                    } else {
                        return ''
                    }
                }
            }
        }
    ]

    return (
        <div>
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <Input
                    type="file"
                    id="myFile"
                    size="50"
                    onChange={(e) => {
                        (async () => {
                            await handleFileLoad(e.target.files[0]);
                        })();
                    }}
                />
                <Button
                    onClick={() =>
                        (async () => {
                            await saveData();
                        })()
                    }
                >
                    Save Data
                </Button>
            </div>

            <div style={{marginTop: '25px'}}>
                <Table
                    columns={columns}
                    dataSource={data}
                    pagination={false}
                    rowClassName={(record, index) => {
                        if (data[index] && data[index].id && data[index + 1] && data[index - 1] && data[index + 1].id && data[index].attendanceCheckPoint && data[index + 1].attendanceCheckPoint) {
                            if ((data[index].id === data[index + 1].id && data[index].attendanceCheckPoint === data[index + 1].attendanceCheckPoint) ||
                                (data[index].id === data[index - 1].id && data[index].attendanceCheckPoint === data[index - 1].attendanceCheckPoint)
                                || ((data[index].id !== data[index + 1].id && data[index].attendanceCheckPoint !== 'Exit_Exit_Entrance Card Reader1') ||
                                    (data[index].id !== data[index - 1].id && data[index].attendanceCheckPoint !== 'Entrance_Entrance_Entrance Card Reader1'))
                            ) {
                                console.log('data -- ', data);
                                
                                return "aaa"
                            } else {
                                return "bbb"
                            }
                        }
                    }}
                />
            </div>
            {calculatedData.length > 0 &&
            <div className={"calculatedTableWrapper"}>
            
            <Table
                dataSource={calculatedData}
                columns={calculatedDataColumns}
                pagination={false}
            />
                <Button onClick={sendCalculatedData}>
                    Send Calculated Data
                </Button>
            </div>
            }
        </div>
    )
}
