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
        $symbol = $meta_data->{"1: Symbol"};
        $fullIndicator = $meta_data->{"2: Indicator"};
        
        $series = $obj->{'Technical Analysis: ' . strtoupper($indicator)};
        
        $subindicators = array_keys((array)($series->$lastDate));
//        var_dump($subindicators);
        
        $dates = array();
        $records = array();
        
        foreach ($subindicators as $subindicator) {
            $records[$subindicator] = array();
        }

        date_default_timezone_set('America/New_York');
        foreach ($series as $date => $record) {
            array_push($dates, $date);
            foreach ($subindicators as $subindicator) {
                array_push($records[$subindicator], +$record->$subindicator);
            }
        }
        $wrap = array('symbol' => $symbol, 'fullIndicator' => $fullIndicator, 'sub-indicators' => $subindicators, 'dates' => $dates);
        foreach ($subindicators as $subindicator) {
            $wrap[$subindicator] = $records[$subindicator];
        }
        $objr = json_encode($wrap, JSON_PRETTY_PRINT);
        echo $objr;
    }
    else {
        echo json_encode(array('error' => 'only suport GET operation.'));
    }
?>