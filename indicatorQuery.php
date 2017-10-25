<?php
    if(isset($_GET)) {
        $symbol = $_GET['symbol'];
        $indicator = $_GET['indicator'];
        $query_url = "https://www.alphavantage.co/query?function={$indicator}&symbol={$symbol}&interval=daily&time_period=10&series_type=open&apikey=XJPOXPVZNXYML3L2";
        $content = file_get_contents($query_url);
        $obj = json_decode($content);
        
        if (!isset($obj) or isset($obj->{'Error Message'})) {
            echo $content;
            return;
        }
        
        $meta_data = $obj->{'Meta Data'};
        $lastDate = $meta_data->{'3: Last Refreshed'};
        
        $series = $obj->{'Technical Analysis: ' . $indicator};
        
        $subtitles = array_keys((array)($series->$lastDate));
        $records = array();
        
//        var_dump($subtitles);
        
        date_default_timezone_set('America/New_York');
        foreach ($series as $date => $record) {
            $dataTuple = array(strtotime($date));
            foreach ($subtitles as $subtitle) {
                array_push($dataTuple, +$record->$subtitle);
            }
            array_push($records, $dataTuple);
        }
        $wrap = array('sub-indicators' => $subtitles, 'data' => $records);
        $objr = json_encode($wrap, JSON_PRETTY_PRINT);
        echo $objr;
    }
    else {
        echo json_encode(array('error' => 'only suport GET operation.'));
    }
?>