const express = require('express');
const router = express.Router({mergeParams : true});
const getPoolConnection = require('../db/dbConnection');
const check_id = require('../function/check_id');

//only support 'Web' application
//전체 가게 이용 내역 조회
router.get('/', (request, response)=> {
    const errorRespond = (error)=>{
        console.error(error);
        return response.status(500).json({
            message: "서버 내부 오류입니다."
        });
    }
    // 요청 형식이 잘못된 경우
    if(!request.params.storeId) {
        return response.status(400).json({
            message: "올바르지 않은 요청입니다."
        });
    }
        check_id.store(request.params.storeId)
        .catch(errorRespond)
        .then(storeId=>{
            if (!storeId) {
                return response.status(404).json({
                    message : "헤잇웨잇에 가입된 가게가 아닙니다."
                });
            } else {
                return storeId;
            }
        })
        .then(storeId=> {
            // 기간 설정 필요한 경우.
            //추가 : WHERE store_id=? AND DATE(visit_time) BETWEEN (NOW() - INTERVAL ? ?) AND NOW()
            // 총 손님 수..?

            //기간 설정 쿼리 예시
            // SELECT DATE(visit_time) , customer_number
            // FROM visit_log
            // WHERE store_id='bani123' AND DATE(visit_time) BETWEEN (NOW() - INTERVAL 7 DAY) AND NOW()
            // ORDER BY visit_time DESC;

            const sql = `SELECT DATE_FORMAT(visit_time, '%Y-%m-%d') AS visit_day, SUM(customer_number) AS daily_customer_number
                       FROM visit_log
                       WHERE store_id = ?
                       GROUP BY visit_day
                       ORDER BY visit_day DESC`;

            getPoolConnection(connection=>{
                connection.execute(sql, [storeId], (error, rows) => {
                    connection.release();
                    if (error) {
                        errorRespond(error);
                    } else if (rows.length === 0) {
                        return response.status(200).json({
                            message: "아직 방문 기록이 없어요!"
                        });
                    } else {
                        // rows,
                        return response.status(200).json({
                            count : rows.length,
                            logs : rows
                        });
                    }
                });
            });
        });

});


module.exports = router;